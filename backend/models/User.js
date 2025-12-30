const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    phone: { type: String },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    isOnline: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    activeSessions: [
      {
        token: String,
        loginTime: { type: Date, default: Date.now },
        lastActivity: { type: Date, default: Date.now },
        userAgent: String,
        ipAddress: String,
      },
    ],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
