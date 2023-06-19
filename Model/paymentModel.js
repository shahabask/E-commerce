const mongoose = require("mongoose");

const orderPayment = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  status: {
    type: String,
    required: false,
  },
  discount: {
    type: Array,
    required: false,
  },
  totalAmount: {
    type: Number,
    required: false,
  },
  refundStatus: {
    type: String,
    default: "Not Requested",
    required: false,
  },
});
