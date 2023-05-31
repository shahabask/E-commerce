const mongoose=require('mongoose')

const admin=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    OTP:{
        type:Number,
        default:'',
        required:false

    },
   
})

module.exports=mongoose.model('Admin',admin)