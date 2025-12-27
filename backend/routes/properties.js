const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const auth = require("../middleware/auth");

// Get all properties
router.get("/", auth, async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });

    // Auto-fix status for existing properties that are fully paid
    const fixedProperties = await Promise.all(
      properties.map(async (p) => {
        const totalPaid = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
        if (totalPaid >= p.totalPrice && p.status !== "Completed") {
          p.status = "Completed";
          await p.save();
        }
        return p;
      })
    );

    res.json(fixedProperties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new property
router.post("/", auth, async (req, res) => {
  try {
    const {
      plotNumber,
      size,
      scheme,
      totalPrice,
      advancePayment,
      downPayment,
      numInstallments,
      numYears,
      monthlyInstallment,
      agent,
      buyerName,
      buyerPhone,
      buyerCnic,
      buyerAddress,
    } = req.body;

    const initialPayments = [];
    if (Number(advancePayment) > 0) {
      initialPayments.push({
        amount: Number(advancePayment),
        type: "Advance",
        month: "Advance/Token Payment",
        agent: agent,
      });
    }
    if (Number(downPayment) > 0) {
      initialPayments.push({
        amount: Number(downPayment),
        type: "Down Payment",
        month: "Down Payment",
        agent: agent,
      });
    }

    const totalInitial =
      (Number(advancePayment) || 0) + (Number(downPayment) || 0);

    const property = new Property({
      plotNumber,
      size,
      scheme,
      totalPrice,
      advancePayment: Number(advancePayment) || 0,
      downPayment: Number(downPayment) || 0,
      numInstallments,
      numYears,
      monthlyInstallment,
      agent,
      agentId: req.user.id,
      buyerName,
      buyerPhone,
      buyerCnic,
      buyerAddress,
      status: totalInitial >= Number(totalPrice) ? "Completed" : "Installment",
      payments: initialPayments,
    });

    await property.save();
    global.broadcast("data-updated", { type: "property", action: "add" });
    res.status(201).json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record a payment
router.post("/:id/pay", auth, async (req, res) => {
  try {
    const { amount, month, type } = req.body;
    const property = await Property.findById(req.params.id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    property.payments.push({
      amount,
      month,
      type: type || "Installment",
      agent: req.user.name || "System Admin",
      date: new Date(),
    });

    // Check if fully paid
    const totalPaid = property.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= property.totalPrice) {
      property.status = "Completed";
    }

    await property.save();
    global.broadcast("data-updated", { type: "property", action: "payment" });
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a specific payment record
router.delete("/:propertyId/payments/:paymentId", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can delete payments" });
    }
    const property = await Property.findById(req.params.propertyId);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    // Use Mongoose pull to remove subdocument by ID
    property.payments.pull({ _id: req.params.paymentId });

    // Re-check status if a payment is deleted
    const totalPaid = property.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < property.totalPrice) {
      property.status = "Installment";
    }

    await property.save();
    global.broadcast("data-updated", {
      type: "property",
      action: "payment-delete",
    });
    res.json(property);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete payment: " + err.message });
  }
});

// Edit a specific payment record
router.put("/:propertyId/payments/:paymentId", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can edit payments" });
    }
    const { amount, month } = req.body;
    const property = await Property.findById(req.params.propertyId);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    const payment = property.payments.id(req.params.paymentId);
    if (!payment)
      return res.status(404).json({ message: "Payment record not found" });

    if (amount) payment.amount = Number(amount);
    if (month) payment.month = month;

    // Re-check status if amount is changed
    const totalPaid = property.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= property.totalPrice) {
      property.status = "Completed";
    } else {
      property.status = "Installment";
    }

    await property.save();
    global.broadcast("data-updated", {
      type: "property",
      action: "payment-edit",
    });
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update property
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can edit properties" });
    }
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    global.broadcast("data-updated", { type: "property", action: "update" });
    res.json(updatedProperty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete property
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can delete properties" });
    }
    await Property.findByIdAndDelete(req.params.id);
    global.broadcast("data-updated", { type: "property", action: "delete" });
    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
