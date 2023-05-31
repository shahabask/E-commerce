const mongoose=require('mongoose')

const user=new mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
           },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:false
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Boolean,
        required:true
    },
    is_block:{
        type:Boolean,
        default:false
    },
    OTP:{
        default:"",
        type:Number,
        required:false

    },
    is_verified:{
        default:0,
        type:Number,
        
    },
    address:[
        {
           head :{
                type:String,
               
            },
            street:{
                type:String
            },
            city:{
                type:String
            },
            landmark:{
                type:String
            },
            pincode:{
                type:Number
            },
            state:{
                type:String
            },
            country:{
                type:String
            }
        }
    ],
    image:{
        type:String,
        required:false
     }

    
})

module.exports=mongoose.model("User",user)
