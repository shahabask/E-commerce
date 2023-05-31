const User=require('../Model/userModel')
const bcrypt=require('bcrypt')
const nodemailer=require('nodemailer')
const randomstring =require('randomstring')
const Product=require('../Model/productModel')
const Category=require('../Model/categoryModel')
const config=require('../config/config')
const Cart=require('../Model/cartModel')
const { default: mongoose } = require('mongoose')
const Order=require('../Model/orderModel')

const securePassword=async(password)=>{
    try{
        const saltRound=10
       const passwordHash= await bcrypt.hash(password,saltRound)
       return passwordHash
    }catch(error){
        console.log(error.message)
    }
}

const sendOTPtoMail=(name,email,otp)=>{
   try{
    const transporter=nodemailer.createTransport({
        host:'smtp.gmail.com',
        port:587,
        secure:false,
        requireTLS:true,    
        auth:{
            user:'codept100@gmail.com',
            pass:'zxzoiokxbinfulnb'
        }
    })
    const mailOptions={
        from:config.smtpOwner,
        to:'shahabasg1@gmail.com',
        subject:'OTP for verifying your email',
        html:`<p> Hi ${name},Use this otp ${otp} to reset your password</p>`,
        text: `Hi ${name},Use this otp ${otp} to reset your password`,
        

    }
    transporter.sendMail(mailOptions,(error,info)=>{
        if(error){
            console.log(error)
        }else{
            console.log('Otp has been sent',info.response)
        }
    })
   }catch(error){
    console.log(error.message);
   }

}



const loadForm=(req,res)=>{
    try{
      res.render('register')
    }catch(error){
        console.log(error.message)
    }
}

const insertUser=async(req,res)=>{
    try{
       
        const spassword=await securePassword(req.body.password)
        const user =new User({
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            email:req.body.email,
            password:spassword,
            is_admin:false,
            is_block:false,
            is_verified:1
        })
      
        const userData=await user.save()
        req.session.user_id=userData._id
        console.log(userData);
        if(userData){
         res.redirect('/')

        }else{
            res.render('registration',{message:'Submit data failed'})
        }

    }catch(error){
        console.log(error.message)
    }
}
const loadLoginForm=(req,res)=>{
    try{
      res.render('u-login')
    }catch(error){
      console.log(error.message)
    }
}
const loadForgetPassword=(req,res)=>{
    try{
       res.render('forgetpassword')
    }catch(error){
        console.log(error.message)
    }
}
const loadOtpVerification=async(req,res)=>{
    try{
      const email=req.body.email
      let otp = Math.floor(100000 + Math.random() * 900000)
      otp=otp.toString()
      console.log(otp);   
      const update=await User.updateOne({email:email},{$set:{OTP:otp}})
      const userData=await User.findOne({email:email})
      if(userData){
      
          sendOTPtoMail(userData.firstName,userData.email,userData.OTP)

        res.render('verifyotp')
      }else{
        res.render('forgetpassword',{message:'User not found'})
      }

    }catch(error){
        console.log(error.message);
    }
}
const verifyOtp=async(req,res)=>{
    try{
        const otp=req.body.otp
       const userData=await User.findOne({OTP:otp})
      
       if(userData){
        console.log(userData._id)
        res.render('passwordreset',{user_id:userData._id})
       }else{
        res.render('verifyotp',{message:'Incorrect OTP'})
       }
    }catch(error){
        console.log(error.message)
    }
}
const verifyPassword=async(req,res)=>{
    try{
        
           const pass1=req.body.reset1
           const pass2=req.body.reset2
           const passwordRegex = /^[a-zA-Z0-9_]{6,}$/
           const spassword=await securePassword(pass1)
           if(!passwordRegex.test(pass1)){
            res.render('passwordreset',{user_id: req.body.user_id,message:'Give a strong password'})
           }else{
            if(pass1==pass2){
                
                const updatedata=await User.updateOne({_id:req.body.user_id},{$set:{password:spassword}})
                res.redirect('/login')
               }else{
                res.render('passwordreset',{user_id: req.body.user_id,message:'Confirmation password is incorrect'})
               }
           }

          
    }catch(error){
        console.log(error.message);
    }
}
const verifyLogin=async(req,res)=>{
    try{
        const email=req.body.email
        const userData= await User.findOne({email:email})
        
        if(userData){
            const pass=req.body.password
            const passwordMatch=await bcrypt.compare(pass,userData.password)
            if(passwordMatch){

                if(userData.is_block){
                    res.render('u-login',{message:'cannot access'})
                }else{
                    req.session.user_id=userData._id
                   
                    console.log("xede",req.session.user_id);
                //    res.redirect('/?value=' + encodeURIComponent(userData.firstName))
                res.redirect('/')
                }
                
            }else{
                res.render('u-login',{message:'invalid password'})
            }

        }else{
            res.render('u-login',{message:'user is not valid'})
        }

    }catch(error){
        console.log(error.message);
    }
}
const logOut=(req,res)=>{
    try{
       req.session.destroy()
       res.redirect('/login')
    }catch(error){
        console.log(error.message);
    }
}
const loadCategory=async(req,res)=>{
    try{
    const categoryName=req.query.category
      const products=await Product.find({category:categoryName})
      const category=await Category.find({})
      if(products[0]){
        res.render('categoryProduct',{products:products,category:category,categoryName:categoryName})
      }else{
        res.render('categoryProduct',{message:'No product is remaining',categoryName:categoryName,category:category})
      }
     
    }catch(error){
        console.log(error.message)

    }
}
const  loadProductDetails=async(req,res)=>{
    try{
        const id=req.query.id
        const category=req.query.category
        const product=await Product.findOne({_id:id})
        const size=await Product.distinct('size',{category:category})
        const color=await Product.distinct('color',{category:category})
        res.render('productdetails',{product:product,admin:false,size:size,color:color})
    
    
    }catch(error){
        console.log(error)
    }
}
const loadEmailForOtp=(req,res)=>{
    try{
      res.render('loademailotplogin')
    }catch(error){
        console.log(error)
    }
}
const sendOtpForLogin=async(req,res)=>{
try{
    const email=req.body.email
    const  userData=await User.findOne({email:email})
if(userData){
        let otp=Math.floor(100000+Math.random()*900000)
       
        otp=otp.toString()
        console.log(otp);
        const updateOtp=await User.updateOne({email:email},{$set:{OTP:otp}})
        sendOTPtoMail(userData.firstName,email,otp)          
        res.render('otplogin')
     }else{
        res.render('loademailotplogin',{message:'invalid user'})
     }
}catch(error){
    console.log(error.message)
}
}
const otpLoginVerify=async(req,res)=>{
    try{

         const otp=req.body.otp
         const userData=await User.findOne({OTP:otp})
         if(userData){
            req.session.user_id=userData._id
            res.redirect('/')
         }else{
            res.render('otplogin',{message:'incorrect otp'})
         }


    }catch(error){
        console.log(error.message)
    }
}
const loadHome=async(req,res)=>{
    try{
       
         const user=await User.findOne({_id:req.session.user_id})
         
         if(user.is_block==false){
          
            const category=await Category.find({})
      
            const products=await Product.find({}).limit(6)
            
        
           res.render('u-home',{products:products,category:category,user:user})
         }else{
            req.session.destroy()
            
            res.redirect('/')
         }
       
     
    }catch(error){
       console.log(error.message)
    }
   }

const loadUserProfile=async(req,res)=>{
    try{
        const id=req.session.user_id
        const user=await User.findOne({_id:id})
        res.render('userprofile',{admin:false,user:user,address:user.address})

    }catch(error){
        console.log(error.message)
    }
}


const loadEditProfile=async(req,res)=>{
    try{
        const id=req.session.user_id
       
        const user=await User.findOne({_id:id})
       
        res.render('edit-profile',{user:user})
    }catch(error){
        console.log(error.message);
    }
}


const saveUserProfile=async(req,res)=>{
    try{
        const id=req.session.user_id
        const user=await User.findOne({_id:req.session.user_id})
        const updatedData={
            firstName:req.body.firstName,
                lastName:req.body.lastName,
                email:req.body.email,
                phone:req.body.phone,
                image:user.image
        }
        
        if(req.file){
            updatedData.image=req.file.filename

        }
      
        const user1=await User.updateOne({_id:id},{$set:updatedData})
        if(user1){
            res.redirect('/userprofile')
        }

    }catch(error){
        console.log(error.message)
    }
}

const loadUserOrders=async(req,res)=>{
    try{
      
        const orders=await Order.find({})
        res.render('userorders',{admin:false,orders:orders})
    }catch(error){
        console.log(error.message);
    }
}
const cancelOrder=async(req,res)=>{
    try{
        const size=req.query.size
        const color=req.query.color
        const productName=req.query.name
     const cancel=await Order.updateOne({userid:req.session.user_id,color:color,size:size,name:productName},
        {$set:{status:'cancelled'}})
        res.redirect('/userorder')
    }catch(error){
        console.log(error.message)
    }
}

const buyProductsFromCart=async(req,res)=>{
    try{
        let total=req.body.total
        total=Number(total)
        const user_id=req.session.user_id
        const cart=await Cart.findOneAndUpdate({userid:user_id},{$set:{total:total}})
      
        // await cart.save()
    //     const shipping=req.body.shipping
    //  console.log(total)
    //  console.log(shipping)
        const id=req.session.user_id
        const user=await User.findOne({_id:id})
        const address=user.address
   


     res.render('selectaddress',{address:address,user:user,total:total})
    }catch(error){
        console.log(error.message);
    }
}
const loadPaymentMethod=async(req,res)=>{
    try{
           
        // const index=req.body.index
        // console.log(index)
        const pipeline = [
            {
              $match: { userid: new mongoose.Types.ObjectId(req.session.user_id) }
            },
            {
              $unwind: "$product"
            },
            {
              $lookup: {
                from: "products",
                localField: "product.productid",
                foreignField: "_id",
                as: "productData"
              }
            },
            {
              $unwind: "$productData"
            },
            {
              $project: {
                _id: 0,
                productid: "$productData._id",
                modelName: "$productData.modelName",
                price: "$productData.price",
                description: "$productData.description",
                category: "$productData.category",
                image: { $arrayElemAt: ["$productData.image", 0] },
                quantity: "$product.quantity",
                size: "$product.size",
                color:"$product.color",
                total: { $multiply: ["$product.quantity", "$productData.price"] }
              }
            },
            {
              $group: {
                _id: null,
                products: { $push: "$$ROOT" },
                total: { $sum: "$total" }
              }
            }
          ];
        
          const cart2 = await Cart.aggregate(pipeline);
          // console.log('cart2: ', cart2);
          // console.log(cart2.length);
        
          if (cart2.length > 0) {
            const { products, total } = cart2[0];
        
  
        const grandTotal=(total+90)
       
          res.render('price-payment',{total:total,grandTotal:grandTotal,shipping:90,products:products})
        }
    }catch(error){
        console.log(error.message)
    }
}


const loadEditAddress=async(req,res)=>{
    try{
        const index=req.query.index
        const id=req.session.user_id
        const user= await User.findOne({_id:id})
        const address=user.address
      res.render('edit-address',{address:address,index:index})
     
    }catch(error){
      console.log(error.message);
    }
}
const updateAddress=async(req,res)=>{
    try{
        const index=req.body.index
        console.log(index)
       const id=req.session.user_id
       const user= await User.findOne({_id:id})
       const address=req.body
       user.address.splice(index,1,{head:address.head,street:address.street,city:address.city,landmark:address.landmark,pincode:address.pincode,state:address.state,country:address.country})
       await user.save()
       res.redirect('/userprofile')
    }catch(error){
        console.log(error.message);
    }
}
   

const loadAddAddress=(req,res)=>{
    try{
      
     res.render('add-address')

    }catch(error){
      console.log(error.message);
    }
}
const saveAddress=async(req,res)=>{
    try{
        const id=req.session.user_id
        const user= await User.findOne({_id:id})
      const address=req.body
     user.address.push({head:address.head,street:address.street,city:address.city,landmark:address.landmark,pincode:address.pincode,state:address.state,country:address.country})   
      await user.save()
      res.redirect('/userprofile')

    }catch(error){
        console.log(error.message)
    }
}
const deleteAddress=async(req,res)=>{
    try{
        const id=req.query.id
        const user=await User.findOne({_id:id})
        const index=req.query.index
        user.address.splice(index,1)
          await user.save()
          res.redirect('/userprofile')
    }catch(error){
         console.log(error.message);
    }
}

const addToCart = async (req, res) => {
    try {
      let proid = req.body.id;
      let prosize = req.body.size;
      let procolor=req.body.color;
      let cart = await Cart.findOne({ userid: req.session.user_id });
      
  
      if (!cart) {
        let newCart = new Cart({ userid: req.session.user_id, product: [] });
        await newCart.save();
        cart = newCart;
  
       
      }
      console.log( cart.userid);  
      const existingproductindex = cart?.product.findIndex(
        (product) => product.productid == proid && product.size == prosize
      );
      console.log(existingproductindex);
  
      if (existingproductindex == -1) {
        cart.product.push({ productid: proid, quantity: 1, size: prosize ,color:procolor});
      } else {
        cart.product[existingproductindex].quantity += 1;
        cart.product.size = req.body.size;
        cart.product.size=req.body.color;
      }
  
      await cart.save();

      
      res.redirect(`/productdetails?id=${proid}`);
    } catch (error) {
      console.log(error.message);
    }
  };
  const buyProductDirectly=(req,res)=>{
    try{

    }catch(error){
        console.log(error.message)
    }
  }

const orderPlaced=async(req,res)=>{
    try{
        const total=req.body.total
        const shipping=req.body.shipping
        const grandTotal=req.body.grandTotal
        console.log('total:'+total, 'ship:'+shipping, 'gt:'+grandTotal)
        // const cart=await Cart.findOne({userid:req.session.user_id})
        // const products=cart.product
        const pipeline = [
            {
              $match: { userid: new mongoose.Types.ObjectId(req.session.user_id) }
            },
            {
              $unwind: "$product"
            },
            {
              $lookup: {
                from: "products",
                localField: "product.productid",
                foreignField: "_id",
                as: "productData"
              }
            },
            {
              $unwind: "$productData"
            },
            {
              $project: {
                _id: 0,
                productid: "$productData._id",
                modelName: "$productData.modelName",
                price: "$productData.price",
                description: "$productData.description",
                category: "$productData.category",
                image: { $arrayElemAt: ["$productData.image", 0] },
                quantity: "$product.quantity",
                size: "$product.size",
                color:"$product.color",
                total: { $multiply: ["$product.quantity", "$productData.price"] },
               
              }
            },
            {
              $group: {
                _id: null,
                products: { $push: "$$ROOT" },
              
              }
            }
          ];
        
          const cart = await Cart.aggregate(pipeline);
          const user=await User.findOne({_id:req.session.user_id})
          if (cart.length > 0) {
            const { products, total } = cart[0];
        for(let i=0;i<products.length;i++){
            let quantity=products[i].quantity
            let price=products[i].price
           let name=products[i].modelName
           let total=products[i].total
           let color=products[i].color
           let size=products[i].size
           let image=products[i].image
           let order=new Order({userid:req.session.user_id,
            quantity:quantity,
            status:'shipped',
            name:name,
            total:total,
            size:size,
            color:color,
            image:image,
            price:price,
            email:user.email,
            phone:user.phone,
            address:user.address[0].head
           }).save()

        }
       
          const orders=await Order.find({}) 
          console.log(orders)
       const removeCart=await Cart.deleteOne({userid:req.session.user_id})
    // ?orders=${orders}&products=${products}
      res.redirect(`/userorder`)
    }
    }catch(error){
        console.log(error.message)
    }
}

const getCart = async (req, res) => {
    const cart=await Cart.findOne({userid:req.session.user_id})
    // console.log('req.session.user_id: ', typeof req.session.user_id);
    // console.log(cart)
    try {
        const pipeline = [
          {
            $match: { userid: new mongoose.Types.ObjectId(req.session.user_id) }
          },
          {
            $unwind: "$product"
          },
          {
            $lookup: {
              from: "products",
              localField: "product.productid",
              foreignField: "_id",
              as: "productData"
            }
          },
          {
            $unwind: "$productData"
          },
          {
            $project: {
              _id: 0,
              productid: "$productData._id",
              modelName: "$productData.modelName",
              price: "$productData.price",
              description: "$productData.description",
              category: "$productData.category",
              image: { $arrayElemAt: ["$productData.image", 0] },
              quantity: "$product.quantity",
              size: "$product.size",
              color:"$product.color",
              total: { $multiply: ["$product.quantity", "$productData.price"] }
            }
          },
          {
            $group: {
              _id: null,
              products: { $push: "$$ROOT" },
              total: { $sum: "$total" }
            }
          }
        ];
      
        const cart2 = await Cart.aggregate(pipeline);
        // console.log('cart2: ', cart2);
        // console.log(cart2.length);
      
        if (cart2.length > 0) {
          const { products, total } = cart2[0];
      console.log(total);
          res.render("usercart", {
            products,
            total:total,
            shipping: 90,
          });
        } else {
          res.render("usercart", { message: "Your cart is empty" });
        }
      } catch (error) {
        console.log(error.message);
      }
      
      
  }
  const removeFromCart=async(req,res)=>{
    try{
        const index=req.query.index
        const cart=await Cart.findOne({userid:req.session.user_id})
       if(cart.product.length>1){
       const removeitem= cart.product.splice(index,1)
       cart.save()
  
       }else{
          const removecart=await Cart.deleteOne({userid:req.session.user_id})
       }
       res.redirect('/usercart')
    }catch(error){

    }
  }

  const updateItem=async(req,res)=>{
    console.log(req.body)
    
    try{
     
     
     const quantity =req.body.quantity
     const proid=req.body.quantity
         console.log(quantity)
         console.log(proid)
   


    }catch(error){
      console.log(error.message)
    }

  }


module.exports={
    loadForm,
    insertUser,
    loadLoginForm,
    loadForgetPassword,loadOtpVerification,verifyOtp,verifyPassword, 
    verifyLogin,
    loadHome,
    logOut,
    loadCategory,
    loadProductDetails,
    loadEmailForOtp,
    sendOtpForLogin,
    otpLoginVerify,
    loadUserProfile,
    loadUserOrders,
    loadPaymentMethod,
    loadEditProfile,saveUserProfile,
    loadAddAddress,saveAddress,loadEditAddress,updateAddress,deleteAddress,
    addToCart,buyProductsFromCart,buyProductDirectly,getCart,removeFromCart,
    orderPlaced,cancelOrder,updateItem

}