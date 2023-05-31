const nodemailer=require('nodemailer')
const config=require('../config/config')
const Admin=require('../Model/adminModel')
const Product=require('../Model/productModel')
const Category=require('../Model/categoryModel')

const Order=require('../Model/orderModel')
const User=require('../Model/userModel')
const sendOtpToMail=(email,otp)=>{
    try{
     const transporter=nodemailer.createTransport({
        host:'smtp.gmail.com',
        port:587,
        secure:false,
        requireTLS:true,
        auth:{
            order:config.smtpOwner,
            pass:config.smtpKey
        }
       
     })
     const mailOption={
         from:config.smtpOwner,
         to:email,
        subject:'OTP for admin',
        html:`use this otp ${otp} for reseting password`,
        text:`use this otp ${otp} for reseting password`
     }
     transporter.sendMail(mailOption,(err,info)=>{
        if(err){
            console.log(err)
        }else{
            console.log('otp send successfully',info.response)
        }
     })
      

    }catch(error){
        console.log(error.message);
    }
}

const loadLoginAd=(req,res)=>{
    try{
       res.render('a-login')
    }catch(error){
        console.log(error.message);
    }
}

const verifyAdmin=async(req,res)=>{
    try{
        const email=req.body.email
        const adminData=await Admin.findOne({email:email})
        if(adminData){
            const pass=req.body.password
            if(adminData.password==pass){
                req.session.admin_id=adminData._id
                res.redirect('/admin/home')
            }else{
                res.render('a-login',{message:'incorrect password'})
            }
          
        }else{
            res.render('a-login',{message:'invalid user'})
        }
    }catch(error){
        console.log(error.message)
    }
    
}
const adminLogOut=(req,res)=>{
    try{
       req.session.destroy()
       res.redirect('/admin')
    }catch(error){
        console.log(error.message);
    }
}
const loadForgetPassword=(req,res)=>{
    try{
       res.render('a-forgetpass')
    }catch(error){
        console.log(error.message)
    }
}
const verifyMail=async(req,res)=>{
      try{
         const email=req.body.email
         const adminData=await Admin.findOne({email:email})
         if(adminData){
            let otp=Math.floor(100000+Math.random()*900000)
            otp=otp.toString()
            const updateOtp=await Admin.updateOne({email:email},{$set:{OTP:otp}})
            sendOtpToMail(email,otp)
            res.render('a-verifyotp')
         }else{
            res.render('a-forgetpass',{message:'invalid order'})
         }
      }catch(error){
        console.log(error.message)
      }
}

const verifyOtp=async(req,res)=>{
   try{
    const otp=req.body.otp
    const adminData=await Admin.findOne({OTP:otp})
    if(adminData){
        res.render('a-resetpass',{admin_id:adminData._id})
    }else{
        res.render('a-verifyotp',{message:'incorrect otp'})
    }
      
   }catch(error){
    console.log(error.message)
   }
}
const verifyPassword=async(req,res)=>{

    try{
        const admin_id=req.body.admin_id
        const pass1=req.body.reset1
        const pass2=req.body.reset2
        if(pass1==pass2){
            const updateData =await Admin.updateOne({_id:admin_id},{$set:{password:pass1}})
            res.redirect('/admin')
        }else{
            res.render('a-resetpass',{admin_id:admin_id,message:'confirmation password is incorrect'})
        }

    }catch(error){
        console.log(error.message);
    }
}
const loadHome=(req,res)=>{
   try{
   res.render('a-dashboard')

   }catch(error){
    console.log(error.message);
   }
}
const logOut=(req,res)=>{
   try{
    req.session.destroy()
    res.redirect('/admin')
   }catch(error){
    console.log(error.message)
   }
}
const loadProductList=async(req,res)=>{
    try{
        const product=await Product.find({})
      res.render('a-products',{product:product})
    }catch(error){
        console.log(error.message);
    }
}
const loadUsersList=async(req,res)=>{
    try{
        const user=await User.find({})
        res.render('a-Users',{user:user})
      }catch(error){
          console.log(error.message);
      }
    }

    const loadOrdersList=async(req,res)=>{
     try{
        
       
         const orders=await Order.find({})
           
            res.render('a-orders',{orders:orders})
        }catch(error){
              console.log(error.message);
        }
    }
    const loadAddProduct=async(req,res)=>{
        try{

            console.log('ninnnnn')
           const category1=await Category.find({}).lean().exec();
           console.log(category1[0])
            res.render('addProduct',{category:category1})

        }catch(error){
            console.log(error.message)
        }
    }

    const addProduct=async(req,res)=>{
        try{
        
                const category=req.body.category
                console.log(category)

    //    var arrayimage=[]
            const categorycheck=await Category.findOne({category_name:category})
            // for(let i=0;i<req.files.length;i++){
            //     arrayimage[i]=req.files[i].filename
            // }
            if(categorycheck){
                console.log(req.body.product_id)
                const product=new Product({
                    modelName:req.body.name,
                    brand:req.body.brand,
                    category:req.body.category,
                    quantity:req.body.quantity,
                    price:req.body.price,
                    size:req.body.size,
                    description:req.body.description,
                    image:req.files.map((file)=>file.filename),
                    color:req.body.color
                   })
                   const productadd=await product.save()
                   res.redirect('/admin/products')
                
                   
            }else{
                res.render('addProduct',{message:'product is not in category, please add it to category',category:''})
            }

        }catch(error){
            console.log(error.message)
        }
    }
 const loadCatogary=async(req,res)=>{
        try{
            const category=await Category.find({})
          res.render('categorymanagement',{category:category})


        }catch(error){
            console.log(error.message)
        }
    }

    const editCategory=async(req,res)=>{
        try{
            const id=req.query.id
          const category=await Category.findOne({_id:id})
         res.render('editcategory',{category:category})
         
        }catch(error){
            console.log(error.message);
            res.send(error.message);
        }
    }

    const deleteCategory=async(req,res)=>{
        try{
           const id=req.query.id
           console.log(id);
       
           const Delete=await Category.deleteOne({_id:id})
           res.redirect('/admin/category') 
     

        }catch(error){
        console.log(error.message);
        }
    }

    const loadAddCategory=(req,res)=>{
        try{
          res.render('addcategory',{message:''})

        }catch(error){
        console.log(error.message);
        }
    }
    const    updateCategory=async(req,res)=>{
        try{
            const id=req.body.categoryId
            console.log('id:', id)
            const name=req.body.categoryName
            console.log(name)
         const update=await Category.updateOne({_id:id},{$set:{category_name:name}})
         console.log(update)
         res.redirect('/admin/category') 
        }catch(error){
console.log(error)
        }
    }
    const addCategory=async(req,res)=>{
        try{
            const categoryNames=req.body.categoryName
            
            for(let i=0;i<categoryNames.length;i++){
           
                const categoryName=categoryNames[i]
                console.log(categoryName);
                const checkCategory=await Category.findOne({category_name: { $regex: categoryName, $options: 'i' }})
                console.log(checkCategory);
                if(checkCategory){
                res.render('addcategory',{message:'category is already defined'})
                }else{
          
                    const category=new Category({
                        category_name:categoryName
                    })
                    await category.save()
               
                    

                }
                
                
                res.redirect('/admin/category')   
            }
           
           
        }catch(error){
            console.log(error.message)
        }
    }
    const blockUser=async(req,res)=>{
        try{
            const id=req.query.id
           
            await User.updateOne({_id:id},{$set:{is_block:true}})
            
            res.redirect('/admin/users')
           
            
        }catch(error){
            console.log(error.message)
        }
    }

    const unBlockUser=async(req,res)=>{
        try{
            const id=req.query.id
           await User.updateOne({_id:id},{$set:{is_block:false}})
            const user= await User.findOne({_id:id})
            // console.log(user.is_block)
            res.redirect('/admin/users')

        }catch(error){

        }
    }
    const loadEditProduct=async(req,res)=>{
        try{
            const id=req.query.id
            console.log(id);
            
            const product=await Product.findOne({_id:id})
            console.log(product)
            const category=await Category.find({})
            res.render('editproduct',{product:product,category:category})

        }catch(error){
            console.log(error.message)
        }
    }
    const editProduct=async(req,res)=>{
        try{
            const id=req.body.id
          
            const currentProduct=await Product.findOne({_id:id})
             let updateField={
                modelName:req.body.name,
                brand:req.body.brand,
                category:req.body.category,
                quantity:req.body.quantity,
                price:req.body.price,
                size:req.body.size,
                description:req.body.description,
                image:currentProduct.image,
                color:req.body.color
                
             }
             if(req.files&&req.files.length>0){
                updateField.image=req.files.map((file)=>file.filename)
            }   
            console.log(updateField.image.length)
            const product=await Product.findByIdAndUpdate({_id:id},{$set:updateField})
            if(product){
                res.redirect('/admin/products')
            }
            

        }catch(error){
            console.log(error.message); 
            res.send(error.message)
        }
    }
    const deleteProduct=async(req,res)=>{
        try{
            const id=req.query.id
            const Delete=await Product.deleteOne({_id:id})
            res.redirect('/admin/products')

        }catch(error){
            console.log(error.message);
        }
    }
 const cancelOrder=async(req,res)=>{
    try{
        const size=req.query.size
        const color=req.query.color
        const userid=req.query.userid
        const productName=req.query.name
        const order=await Order.updateOne({userid:userid,color:color,size:size,name:productName},{$set:{status:'cancelled'}})
          res.redirect('/admin/orders')
    }catch(error){
        console.log(error.message);
    }
 }
 const deleteOrder=async(req,res)=>{
    try{
        const size=req.query.size
        const color=req.query.color
        const userid=req.query.userid
        const productName=req.query.name
        const order=await Order.deleteOne({userid:userid,color:color,size:size,name:productName})
        res.redirect('/admin/orders')
    }catch(error){
        console.log(error.message);
    }
 }


module.exports={
    loadLoginAd,
    loadForgetPassword,
    verifyAdmin,
    verifyMail,
    verifyOtp,
    verifyPassword,
    adminLogOut,
    loadHome,
    logOut,
    loadProductList,
    loadUsersList,
    loadOrdersList,
    loadAddProduct,
    addProduct,
    loadCatogary,
    editCategory,
    deleteCategory,
    loadAddCategory,
    updateCategory,
    addCategory,
    editProduct,
    deleteProduct,
    loadEditProduct,
    blockUser,
    unBlockUser,
    cancelOrder,
    deleteOrder

}