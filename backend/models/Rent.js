const mongoose = require("mongoose");

const RentSchema = new mongoose.Schema(
  {
    houseNumber: { type: String, required: true },
    address: { type: String },
    type: { type: String }, // House, Apartment, Shop, etc.
    ownerName: { type: String },
    ownerPhone: { type: String },

    // Tenant Details (Rent Customer)
    tenantName: { type: String },
    tenantFatherName: { type: String },
    tenantPhone: { type: String },
    tenantCnic: { type: String },
    tenantAddress: { type: String },
    tenantPermanentAddress: { type: String },
    tenantOccupation: { type: String },
    tenantWorkAddress: { type: String },
    tenantReferenceName: { type: String },
    tenantReferencePhone: { type: String },

    // Rent Details
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number },
    status: { type: String, default: "Occupied" },
    rentDueDate: { type: String },
    startDate: { type: String },
    endDate: { type: String },

    payments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        type: { type: String, default: "Rent" }, // 'Rent', 'Security', 'Electricity', 'Water', 'Misc'
        month: { type: String }, // 'Jan 2025'
        agent: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rent", RentSchema);
