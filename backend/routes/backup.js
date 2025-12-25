const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Property = require("../models/Property");

// Create Complete Backup (Admin Only)
router.get("/create-backup", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    console.log("Creating backup for admin:", req.user.id);

    // Get all data from database
    const users = await User.find({}).select("-__v");
    const properties = await Property.find({}).select("-__v");

    // Create backup object
    const backup = {
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: req.user.name,
        version: "1.0",
        totalUsers: users.length,
        totalProperties: properties.length,
      },
      data: {
        users: users,
        properties: properties,
      },
    };

    console.log("Backup created successfully");
    console.log("Users:", users.length, "Properties:", properties.length);

    res.json({
      success: true,
      message: "Backup created successfully",
      backup: backup,
    });
  } catch (err) {
    console.error("Backup creation error:", err);
    res
      .status(500)
      .json({ message: "Failed to create backup", error: err.message });
  }
});

// Restore from Backup (Admin Only)
router.post("/restore-backup", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { backup } = req.body;

    if (!backup || !backup.data) {
      return res.status(400).json({ message: "Invalid backup file" });
    }

    console.log("Starting restore process...");
    console.log("Backup metadata:", backup.metadata);

    // Clear existing data (DANGEROUS - only for restore)
    await User.deleteMany({});
    await Property.deleteMany({});
    console.log("Existing data cleared");

    // Restore users
    if (backup.data.users && backup.data.users.length > 0) {
      // Don't re-hash passwords - they're already hashed in backup
      const usersToInsert = backup.data.users.map((user) => {
        const { _id, ...userData } = user;
        return userData;
      });

      await User.insertMany(usersToInsert, { ordered: false });
      console.log("Users restored:", backup.data.users.length);
    }

    // Restore properties
    if (backup.data.properties && backup.data.properties.length > 0) {
      const propertiesToInsert = backup.data.properties.map((prop) => {
        const { _id, ...propData } = prop;
        return propData;
      });

      await Property.insertMany(propertiesToInsert, { ordered: false });
      console.log("Properties restored:", backup.data.properties.length);
    }

    res.json({
      success: true,
      message: "Backup restored successfully",
      restored: {
        users: backup.data.users?.length || 0,
        properties: backup.data.properties?.length || 0,
      },
    });
  } catch (err) {
    console.error("Restore error:", err);
    res.status(500).json({
      message: "Failed to restore backup",
      error: err.message,
    });
  }
});

// Get Backup Statistics (Admin Only)
router.get("/backup-stats", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    console.log("Fetching backup statistics...");

    const userCount = await User.countDocuments();
    const propertyCount = await Property.countDocuments();

    // Count total payments across all properties
    const properties = await Property.find({});
    let totalPayments = 0;
    properties.forEach((prop) => {
      if (prop.payments && Array.isArray(prop.payments)) {
        totalPayments += prop.payments.length;
      }
    });

    console.log("Stats:", {
      users: userCount,
      properties: propertyCount,
      payments: totalPayments,
    });

    res.json({
      success: true,
      stats: {
        users: userCount,
        properties: propertyCount,
        payments: totalPayments,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res
      .status(500)
      .json({ message: "Failed to get stats", error: err.message });
  }
});

module.exports = router;
