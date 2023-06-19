const mongoose = require("mongoose");

const product = new mongoose.Schema({
  color: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: false,
  },
  brand: {
    type: String,
    required: true,
  },
  image: {
    type: Array,
    required: false,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
  },
  modelName: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Product", product);
