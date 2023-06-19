const mongoose = require("mongoose");

const wallet = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  balance: {
    type: Number,
    default: 0,
    
  },
  history: [
    {
      transactionDate: {
        type: Date,
        required: false,
      },
      amount: {
        type: Number,
        required: false,
      },
      description: {
        type: String,
        required: false,
      },
    },
  ],
});


module.exports=mongoose.model("Wallet", wallet)