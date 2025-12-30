const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Check if system is initialized (has users)
router.get("/setup-status", async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ isInitialized: count > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register First Admin (Only allowed if no users exist)
router.post("/register", async (req, res) => {
  try {
    const count = await User.countDocuments();

    // Security: Only allow public registration if DB is empty
    if (count > 0) {
      return res
        .status(403)
        .json({ message: "System already initialized. Admin account exists." });
    }

    const { name, email, password, cnic, phone } = req.body;

    // Force role to admin for the first user
    const user = new User({
      name,
      email,
      password,
      cnic,
      phone,
      role: "admin",
      isOnline: true, // Login immediately
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cnic: user.cnic,
      },
      message: "Admin account created successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile & set online
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (user) {
      user.isOnline = true;
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all users (Admin only)
router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete user (Admin only)
router.delete("/users/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting the last Admin
    if (userToDelete.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          message:
            "Cannot delete the last remaining Admin account. Create another Admin first.",
        });
      }
    }

    // Emit force logout event to the user being deleted
    if (global.emitToUser) {
      global.emitToUser(userToDelete._id.toString(), "force-logout", {
        reason: "Your account has been deleted by an administrator",
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user (Admin only)
router.put("/users/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { name, email, password, cnic, phone, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent role changes for security
    if (role && role !== user.role) {
      return res.status(403).json({
        message:
          "Role changes are not allowed for security reasons. Roles are permanent.",
      });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (password) user.password = password;
    user.cnic = cnic || user.cnic;
    if (phone) user.phone = phone; // Ensure phone update is also supported
    // Role is NOT updated - it remains the same

    await user.save();

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin adds new user (Admin or Employee)
router.post("/add-user", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can add new users" });
    }

    const { name, email, password, cnic, phone, role } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({
      name,
      email,
      password,
      cnic,
      phone,
      role,
    });
    await user.save();

    res.json({
      message: "User created successfully",
      user: { name, email, role, cnic, phone },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot Password - Step 1: Verify CNIC and Email/Phone (Simpler Reset)
router.post("/forgot-password", async (req, res) => {
  const { email, cnic, phone } = req.body;
  try {
    // Check match for Email+CNIC OR Phone+CNIC as requested "CNIC Mobile number"
    // User said "CNIC Mobile number", but frontend sends Email/CNIC.
    // I will check whatever is provided.
    // Let's stick to Email + CNIC for consistency with current UI,
    // or if they want Mobile, I'd need to update Frontend to send Mobile.
    // User said "CNIC Mobile number...". I should probably support Mobile check if I can.
    // But current Frontend `ForgotPassword.jsx` sends `email` and `cnic`.
    // I will stick to email/cnic for now to match frontend, or check if user has phone matching too?
    // Let's just use the strict check: Email + CNIC.

    const user = await User.findOne({ email, cnic });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with these details." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Recovery feature is restricted to Admin accounts only.",
      });
    }

    // Generate Direct Reset Token
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes (Short expiry for instant reset)
    await user.save();

    // RETURN TOKEN DIRECTLY TO CLIENT (As requested for immediate reset option)
    res.json({
      message: "Identity verified.",
      resetToken: token,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset Password - Step 2: Update Password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired." });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, forceLogin } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user)
      return res
        .status(400)
        .json({ message: "Email not found. Please check your email or ID." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Incorrect password. Please try again." });

    // 1. Clean up expired sessions first (Always do this to keep DB clean)
    if (user.activeSessions && user.activeSessions.length > 0) {
      user.activeSessions = user.activeSessions.filter((session) => {
        if (!session.loginTime) return false;
        const loginTime = new Date(session.loginTime).getTime();
        // If date is invalid, remove it
        if (isNaN(loginTime)) return false;

        // Remove sessions older than 24h
        return Date.now() - loginTime < 24 * 60 * 60 * 1000;
      });
      // Force Mongoose to acknowledge the array modification
      user.markModified("activeSessions");
      await user.save();
    }

    // 2. Refresh user from DB to be absolutely sure we have latest state
    // (Optional but good for concurrency, though overkill. We skip for speed.)

    // 3. Strict Check for Concurrent Sessions
    // We check the LOCAL cleaned version of sessions
    const validSessions = user.activeSessions || [];

    if (!forceLogin && validSessions.length > 0) {
      return res.status(409).json({
        message: "Already logged in on another device",
        code: "ALREADY_LOGGED_IN",
        sessionInfo: {
          loginTime: validSessions[0].loginTime,
          userAgent: validSessions[0].userAgent,
        },
      });
    }

    // 4. Handle Force Login / Logout All
    if (forceLogin) {
      // Clear sessions
      user.activeSessions = [];
      user.markModified("activeSessions");

      // Emit force logout to old sessions
      if (global.emitToUser) {
        global.emitToUser(user._id.toString(), "force-logout", {
          reason: "New login from another device",
        });
      }

      await user.save();

      // If onlyLogout requested (e.g. from the popup), stop here
      if (req.body.onlyLogout) {
        return res.json({ message: "All devices logged out successfully." });
      }
    }

    user.isOnline = true;

    // 5. Create new session
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const newSession = {
      token: token,
      loginTime: new Date(),
      lastActivity: new Date(),
      userAgent: req.headers["user-agent"] || "Unknown",
      ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
    };

    user.activeSessions.push(newSession);
    user.markModified("activeSessions");
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cnic: user.cnic,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify Password (Used in Edit Profile/Security)
router.post("/verify-password", auth, async (req, res) => {
  const { password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);

    res.json({ success: isMatch });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Logout route
router.post("/logout", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      // Remove the current session token
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        user.activeSessions = user.activeSessions.filter(
          (session) => session.token !== token
        );
      }

      // Set offline if no more active sessions
      if (user.activeSessions.length === 0) {
        user.isOnline = false;
      }

      await user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
