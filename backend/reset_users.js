const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/property-db")
  .then(async () => {
    await User.deleteMany({});
    process.exit(0);
  })
  .catch((err) => {
    process.exit(1);
  });
