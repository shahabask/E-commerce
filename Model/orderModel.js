const mongoose=require('mongoose')

const order=new mongoose.Schema({
    userid:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User'
    },

 status:{
    type:String,
    required:true
 },
 quantity:{
    type:Number,
    required:true
 },
 total:{
   type:Number,
   required:true
 },
name:{
   type:String,
   required:true
},
size:{
   type:String,
   required:true
},
color:{
   type:String,
   required:true
},
image:{
   type:String,
   required:true
},price:{
   type:String,
   required:true
},

 email:{
      type:String,
      required:true
   },
phone:{
    type:String,
   required:true
 },
 address:{
        type:String,
        required:true
    }


})



module.exports=mongoose.model("Order",order)