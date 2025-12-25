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
      console.log("\n=== Testing User Found ===");
      console.log("Name:", testingUser.name);
      console.log("Email:", testingUser.email);
      console.log("Role:", testingUser.role);
      console.log("Password Hash:", testingUser.password);
      console.log("Security Questions:", testingUser.securityQuestions);

      // Test password comparison
      const testPassword = "123456"; // Common test password
      const isMatch = await testingUser.comparePassword(testPassword);
      console.log(`\nPassword "${testPassword}" matches:`, isMatch);

      // Check if password looks like bcrypt hash
      const isBcryptHash =
        testingUser.password.startsWith("$2a$") ||
        testingUser.password.startsWith("$2b$");
      console.log("Is valid bcrypt hash:", isBcryptHash);
    } else {
      console.log("Testing user not found!");
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
