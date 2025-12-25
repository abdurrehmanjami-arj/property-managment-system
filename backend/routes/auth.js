const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const auth = require("../middleware/auth");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, cnic, phone, role, securityQuestions } =
      req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const { birthPlace, favoritePet, motherName, favoriteColor } =
      securityQuestions || {};
    user = new User({
      name,
      email,
      password,
      cnic,
      phone,
      role,
      securityQuestions: {
        birthPlace: birthPlace?.toLowerCase().trim(),
        favoritePet: favoritePet?.toLowerCase().trim(),
        motherName: motherName?.toLowerCase().trim(),
        favoriteColor: favoriteColor?.toLowerCase().trim(),
      },
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({
      token,
      user: {
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
    const { name, email, password, cnic, role, securityQuestions } = req.body;
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
    // Role is NOT updated - it remains the same

    if (securityQuestions) {
      console.log(
        "Updating security questions for:",
        user.email,
        securityQuestions
      );
      const { birthPlace, favoritePet, motherName, favoriteColor } =
        securityQuestions;
      user.securityQuestions = {
        birthPlace:
          birthPlace?.toLowerCase().trim() ||
          user.securityQuestions?.birthPlace ||
          "",
        favoritePet:
          favoritePet?.toLowerCase().trim() ||
          user.securityQuestions?.favoritePet ||
          "",
        motherName:
          motherName?.toLowerCase().trim() ||
          user.securityQuestions?.motherName ||
          "",
        favoriteColor:
          favoriteColor?.toLowerCase().trim() ||
          user.securityQuestions?.favoriteColor ||
          "",
      };
      user.markModified("securityQuestions");
    }

    await user.save();
    console.log("User updated successfully in DB");
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

    const { name, email, password, cnic, phone, role, securityQuestions } =
      req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const { birthPlace, favoritePet, motherName, favoriteColor } =
      securityQuestions || {};

    user = new User({
      name,
      email,
      password,
      cnic,
      phone,
      role,
      securityQuestions: {
        birthPlace: birthPlace?.toLowerCase().trim(),
        favoritePet: favoritePet?.toLowerCase().trim(),
        motherName: motherName?.toLowerCase().trim(),
        favoriteColor: favoriteColor?.toLowerCase().trim(),
      },
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

// Verify Security Questions
router.post("/verify-security", async (req, res) => {
  const { email, answers } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Recovery is only allowed for Admin accounts." });
    }

    if (!user.securityQuestions) {
      return res
        .status(400)
        .json({ message: "No security questions set for this user" });
    }

    const q = user.securityQuestions;
    const isCorrect =
      q.birthPlace?.toLowerCase().trim() ===
        answers.birthPlace?.toLowerCase().trim() &&
      q.favoritePet?.toLowerCase().trim() ===
        answers.favoritePet?.toLowerCase().trim() &&
      q.motherName?.toLowerCase().trim() ===
        answers.motherName?.toLowerCase().trim() &&
      q.favoriteColor?.toLowerCase().trim() ===
        answers.favoriteColor?.toLowerCase().trim();

    if (!isCorrect) {
      return res
        .status(400)
        .json({ message: "Incorrect answers to security questions" });
    }

    // Generate a temporary one-time token for reset
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    res.json({ message: "Identity verified", resetToken: token });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Forgot Password - Step 1: Verify CNIC and Email
router.post("/forgot-password", async (req, res) => {
  const { email, cnic } = req.body;
  try {
    const user = await User.findOne({ email, cnic });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this Email and CNIC not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Recovery feature is restricted to Admin accounts only.",
      });
    }

    // Generate Token
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Property System Password Reset",
      text:
        `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
        `http://${req.headers.host}/reset-password/${token}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reset link sent to your email" });
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

    // Check for existing active sessions
    if (!forceLogin && user.activeSessions && user.activeSessions.length > 0) {
      // Check if any session is still valid (less than 24 hours old)
      const validSessions = user.activeSessions.filter((session) => {
        const sessionAge = Date.now() - new Date(session.loginTime).getTime();
        return sessionAge < 24 * 60 * 60 * 1000; // 24 hours
      });

      if (validSessions.length > 0) {
        return res.status(409).json({
          message: "Already logged in on another device",
          code: "ALREADY_LOGGED_IN",
          sessionInfo: {
            loginTime: validSessions[0].loginTime,
            userAgent: validSessions[0].userAgent,
          },
        });
      }
    }

    // If forceLogin is true, clear all existing sessions and emit logout event
    if (forceLogin && user.activeSessions && user.activeSessions.length > 0) {
      // Emit force logout to all active sessions
      if (global.emitToUser) {
        global.emitToUser(user._id.toString(), "force-logout", {
          reason: "New login from another device",
        });
      }
      user.activeSessions = [];
    }

    user.isOnline = true;

    // Create new session
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Add new session to activeSessions
    const newSession = {
      token: token,
      loginTime: new Date(),
      lastActivity: new Date(),
      userAgent: req.headers["user-agent"] || "Unknown",
      ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
    };

    user.activeSessions.push(newSession);
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
    console.log("Password verification attempt for user:", req.user.id);

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log("User not found:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Comparing password for user:", user.email);
    const isMatch = await user.comparePassword(password);
    console.log("Password match result:", isMatch);

    res.json({ success: isMatch });
  } catch (err) {
    console.error("Password verification error:", err);
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
