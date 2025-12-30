const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    process.exit(0);
  })
  .catch((err) => {
    process.exit(1);
  });
