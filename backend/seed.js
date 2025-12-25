const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      const bcrypt = require("bcryptjs");
      const email = "admin@estatepro.com";
      const password = "adminpassword";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const adminData = {
        name: "Admin",
        email: email,
        password: hashedPassword,
        cnic: "42101-1234567-1",
        role: "admin",
        securityQuestions: {
          birthPlace: "Karachi",
          favoritePet: "Cat",
          motherName: "Fatima",
          favoriteColor: "Blue",
        },
      };

      await User.updateOne({ email }, { $set: adminData }, { upsert: true });
    } catch (e) {
      // Silent error handling
    } finally {
      process.exit();
    }
  })
  .catch((err) => {
    process.exit(1);
  });
