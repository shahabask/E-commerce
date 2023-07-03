const mongoose = require("mongoose");

const coupon = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
  },
  percentage: {
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
  startingDate:{
    type:Date,
    required:true,
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
