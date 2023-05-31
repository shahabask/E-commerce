const mongoose=require('mongoose')

const cart=new mongoose.Schema({
     userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
     },
     product:[  
        {
            productid:{
                type:mongoose.Schema.Types.ObjectId,
            ref:'Product',
        },
        quantity:{
            type:Number,
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
        total:{
            type:String,
            default:0
        }
    }
     ],
     total:{
        type:Number,
        default:0,
        required:false
     }

})



module.exports=mongoose.model("Cart",cart)