const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/property-db")
  .then(async () => {
    console.log("Connected to MongoDB.");
    console.log("Deleting all users...");
    await User.deleteMany({});
    console.log("All users have been deleted successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
