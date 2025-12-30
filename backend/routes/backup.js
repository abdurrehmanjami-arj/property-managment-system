const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Property = require("../models/Property");
const Rent = require("../models/Rent");

// Create Complete Backup (Admin Only)
router.get("/create-backup", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Get all data from database
    const users = await User.find({}).select("-__v");
    const properties = await Property.find({}).select("-__v");
    const rents = await Rent.find({}).select("-__v");

    // Create backup object
    const backup = {
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: req.user.name,
        version: "1.0",
        totalUsers: users.length,
        totalProperties: properties.length,
        totalRents: rents.length,
      },
      data: {
        users: users,
        properties: properties,
        rents: rents,
      },
    };

    res.json({
      success: true,
      message: "Backup created successfully",
      backup: backup,
    });
  } catch (err) {
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

    // Clear existing data (DANGEROUS - only for restore)
    await User.deleteMany({});
    await Property.deleteMany({});
    await Rent.deleteMany({});

    // Restore users
    if (backup.data.users && backup.data.users.length > 0) {
      // Don't re-hash passwords - they're already hashed in backup
      const usersToInsert = backup.data.users.map((user) => {
        const { _id, ...userData } = user;
        return userData;
      });

      await User.insertMany(usersToInsert, { ordered: false });
    }

    // Restore properties
    if (backup.data.properties && backup.data.properties.length > 0) {
      const propertiesToInsert = backup.data.properties.map((prop) => {
        const { _id, ...propData } = prop;
        return propData;
      });

      await Property.insertMany(propertiesToInsert, { ordered: false });
    }

    // Restore rents
    if (backup.data.rents && backup.data.rents.length > 0) {
      const rentsToInsert = backup.data.rents.map((rent) => {
        const { _id, ...rentData } = rent;
        return rentData;
      });

      await Rent.insertMany(rentsToInsert, { ordered: false });
    }

    res.json({
      success: true,
      message: "Backup restored successfully",
      restored: {
        users: backup.data.users?.length || 0,
        properties: backup.data.properties?.length || 0,
        rents: backup.data.rents?.length || 0,
      },
    });
  } catch (err) {
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

    const userCount = await User.countDocuments();
    const propertyCount = await Property.countDocuments();
    const rentCount = await Rent.countDocuments();

    // Count total payments across all properties
    const properties = await Property.find({});
    let totalPayments = 0;
    properties.forEach((prop) => {
      if (prop.payments && Array.isArray(prop.payments)) {
        totalPayments += prop.payments.length;
      }
    });

    res.json({
      success: true,
      stats: {
        users: userCount,
        properties: propertyCount,
        rents: rentCount,
        payments: totalPayments,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to get stats", error: err.message });
  }
});

module.exports = router;
