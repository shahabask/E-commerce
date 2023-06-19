const mongoose = require("mongoose");

const cart = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  product: [
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
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
      color: {
        type: String,
        required: true,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
  ],
  grandTotal: {
    type: Number,
    default: 0,
    required: false,
  },
  //  couponApplied:{
  //     type:Boolean,
  //     default:false
  //  }
});

module.exports = mongoose.model("Cart", cart);
