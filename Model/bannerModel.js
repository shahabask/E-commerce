const mongoose=require('mongoose')

const banner= new mongoose.Schema({
    image:{
        type:String,
        required:true
    },
    status:{
        type:Number,
         default:0
    }
})
module.exports=mongoose.model("Banner",banner)