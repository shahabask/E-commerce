const mongoose = require("mongoose");

const coupon = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    default: "Active",
  },
});

module.exports = mongoose.model("Coupon", coupon);
