require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    const testingUser = await User.findOne({ email: "testing@test.com" });
    if (testingUser) {
      const newPassword = "123456";
      testingUser.password = newPassword;
      await testingUser.save();
    }
    process.exit(0);
  })
  .catch((err) => {
    process.exit(1);
  });
