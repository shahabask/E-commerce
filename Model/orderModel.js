const mongoose = require("mongoose");

const order = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  status: {
    type: String,
    default: "pending",
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      price:{
        type:Number,
        required:false
      },
      quantity: {
        type: Number,
        required: false,
      },
      size: {
        type: String,
        required: false,
      },
      color: {
        type: String,
        required: false,
      },
      total: {
        type: Number,
        required: false,
      },
    },
  ],
  grandTotal: {
    type: Number,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveredDate: {
    type: Date,
    required: false,
    index:true,
  },
  discount: {
    type: Number,
    required: false,
  },
  couponPassed:{
    type:Boolean,
    default:false
  }
});

module.exports = mongoose.model("Order", order);
