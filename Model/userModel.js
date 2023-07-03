const mongoose = require("mongoose");

const user = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    required: false,
  },
  isBlock: {
    type: Boolean,
    default: false,
  },
  OTP: {
    default: "",
    type: Number,
    required: false,
  },
  isVerified: {
    default: 0,
    type: Number,
  },
  address: [
    {
      head: {
        type: String,
      },
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      landmark: {
        type: String,
      },
      pincode: {
        type: Number,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
      },
    },
  ],
  image: {
    type: String,
    required: false,
  },
  referralCode:{
    type:String,
    required:false
  },
  referralCodeUsed:{
    type:String,
    default:0,
  },
  otpExpiration:{
    type:Date,
    default:0
  },
 totalOrders:{
  type:Number,
  default:0
 }
});

module.exports = mongoose.model("User", user);
