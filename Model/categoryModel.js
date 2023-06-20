const mongoose = require("mongoose");

const category = new mongoose.Schema({
  image: {
    type: Array,
    required: false,
  },
  category_name: {
    type: String,
    required: true,
  },
  discount:{
    type:Number,
    required:false
  }
});

module.exports = mongoose.model("Category", category);
