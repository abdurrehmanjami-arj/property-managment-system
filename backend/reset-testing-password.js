require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Find testing user
    const testingUser = await User.findOne({ email: "testing@test.com" });

    if (testingUser) {
      console.log("\n=== Resetting Testing User Password ===");
      console.log("User:", testingUser.name, "(" + testingUser.email + ")");

      // Set new password - it will be auto-hashed by pre-save hook
      const newPassword = "123456";
      testingUser.password = newPassword;

      await testingUser.save();

      console.log("✅ Password reset to:", newPassword);

      // Verify it works
      const updatedUser = await User.findOne({ email: "testing@test.com" });
      const isMatch = await updatedUser.comparePassword(newPassword);
      console.log("✅ Password verification:", isMatch ? "SUCCESS" : "FAILED");
    } else {
      console.log("❌ Testing user not found!");
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
