const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  address: String,
  nonce: String,
  loginCount: Number
});

const User = mongoose.model("user", userSchema);

module.exports = User;
