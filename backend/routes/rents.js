const express = require("express");
const router = express.Router();
const Rent = require("../models/Rent");
const auth = require("../middleware/auth");

// Get all rents
router.get("/", auth, async (req, res) => {
  try {
    const rents = await Rent.find().sort({ createdAt: -1 });
    res.json(rents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new rent house
router.post("/", auth, async (req, res) => {
  try {
    const {
      houseNumber,
      address,
      type,
      ownerName,
      ownerPhone,
      tenantName,
      tenantFatherName,
      tenantPhone,
      tenantCnic,
      tenantAddress,
      tenantPermanentAddress,
      tenantOccupation,
      tenantWorkAddress,
      tenantReferenceName,
      tenantReferencePhone,
      monthlyRent,
      securityDeposit,
      rentDueDate,
      startDate,
      endDate,
      status,
    } = req.body;

    const rent = new Rent({
      houseNumber,
      address,
      type,
      ownerName,
      ownerPhone,
      tenantName,
      tenantFatherName,
      tenantPhone,
      tenantCnic,
      tenantAddress,
      tenantPermanentAddress,
      tenantOccupation,
      tenantWorkAddress,
      tenantReferenceName,
      tenantReferencePhone,
      monthlyRent,
      securityDeposit,
      rentDueDate,
      startDate,
      endDate,
      status: status || "Vacant",
    });

    await rent.save();
    global.broadcast("data-updated", { type: "rent", action: "add" });
    res.status(201).json(rent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record a rent payment
router.post("/:id/pay", auth, async (req, res) => {
  try {
    const { amount, month, type, note } = req.body;
    const rent = await Rent.findById(req.params.id);
    if (!rent) return res.status(404).json({ message: "Rent house not found" });

    rent.payments.push({
      amount,
      month,
      type: type || "Rent",
      agent: req.user.name || "System Admin",
      date: new Date(),
    });

    await rent.save();
    global.broadcast("data-updated", { type: "rent", action: "payment" });
    res.json(rent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a specific payment record
router.put("/:rentId/payments/:paymentId", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can edit payments" });
    }
    const { amount, month, type, date } = req.body;
    const rent = await Rent.findById(req.params.rentId);
    if (!rent)
      return res.status(404).json({ message: "Rent record not found" });

    const payment = rent.payments.id(req.params.paymentId);
    if (!payment)
      return res.status(404).json({ message: "Payment record not found" });

    if (amount) payment.amount = amount;
    if (month) payment.month = month;
    if (type) payment.type = type;
    if (date) payment.date = date;

    await rent.save();

    global.broadcast("data-updated", {
      type: "rent",
      action: "payment-update",
    });
    res.json(rent);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update payment: " + err.message });
  }
});

// Update rent
router.put("/:id", auth, async (req, res) => {
  try {
    // Only admin can update core details if that's the rule for properties
    // Actually in properties.js, PUT /:id is admin only.
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can edit rent records" });
    }
    const updatedRent = await Rent.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    global.broadcast("data-updated", { type: "rent", action: "update" });
    res.json(updatedRent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete rent
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can delete rent records" });
    }
    await Rent.findByIdAndDelete(req.params.id);
    global.broadcast("data-updated", { type: "rent", action: "delete" });
    res.json({ message: "Rent record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a specific payment record
router.delete("/:rentId/payments/:paymentId", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can delete payments" });
    }
    const rent = await Rent.findById(req.params.rentId);
    if (!rent)
      return res.status(404).json({ message: "Rent record not found" });

    rent.payments.pull({ _id: req.params.paymentId });
    await rent.save();
    global.broadcast("data-updated", {
      type: "rent",
      action: "payment-delete",
    });
    res.json(rent);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete payment: " + err.message });
  }
});

module.exports = router;
