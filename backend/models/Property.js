const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    plotNumber: { type: String, required: true },
    size: { type: String }, // 5 Marla, 10 Marla etc.
    scheme: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    advancePayment: { type: Number, required: true },
    numInstallments: { type: Number },
    numYears: { type: Number },
    monthlyInstallment: { type: Number },
    agent: { type: String },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "Installment" },
    buyerName: { type: String },
    buyerPhone: { type: String },
    buyerCnic: { type: String },
    buyerAddress: { type: String },
    payments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        type: { type: String, default: "Installment" }, // 'Installment', 'Advance', 'Misc'
        month: { type: String }, // 'Jan 2025'
        agent: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", PropertySchema);
