const express=require('express')
const userRoute=express()

userRoute.set('view engine','ejs')
userRoute.set('views','./views/user')

const auth=require('../middlewares/userauth')

const userController=require('../controller/usercontroller')
const path=require('path')
const multer=require('multer')


const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,'../public/userImage'))
    },
    filename:(req,file,cb)=>{
        const name= Date.now()+'-'+file.originalname;
        cb(null,name)
    }
})
const upload=multer({storage:storage})

userRoute.get('/',auth.is_loggedIn,userController.loadHome)

userRoute.get('/register',auth.is_loggedOut,userController.loadForm)
userRoute.post('/register',userController.insertUser)

userRoute.get('/login',auth.is_loggedOut,userController.loadLoginForm)
userRoute.post('/login',userController.verifyLogin)
userRoute.get('/logout',auth.is_loggedIn,userController.logOut)

userRoute.get('/otploginemail',auth.is_loggedOut,userController.loadEmailForOtp)
userRoute.post('/otploginemail',userController.sendOtpForLogin)
userRoute.post('/otplogin',userController.otpLoginVerify)

userRoute.get('/forget',auth.is_loggedOut,userController.loadForgetPassword)
userRoute.post('/forget',userController.loadOtpVerification)
userRoute.post('/verifyotp',userController.verifyOtp)

userRoute.post('/confirm',userController.verifyPassword)

userRoute.get('/categoryproduct',auth.is_loggedIn,userController.loadCategory)
userRoute.get('/productdetails',auth.is_loggedIn,userController.loadProductDetails)
userRoute.get('/userprofile',auth.is_loggedIn,userController.loadUserProfile)


userRoute.get('/userorder',auth.is_loggedIn,userController.loadUserOrders)

userRoute.get('/usercart',auth.is_loggedIn,userController.getCart)


userRoute.get('/editprofile',auth.is_loggedIn,userController.loadEditProfile)
userRoute.post('/editprofile',upload.single('image'),userController.saveUserProfile)

userRoute.get('/editaddress',auth.is_loggedIn,userController.loadEditAddress)
userRoute.post('/updateaddress',userController.updateAddress)
userRoute.get('/addaddress',auth.is_loggedIn,userController.loadAddAddress)
userRoute.post('/saveaddress',userController.saveAddress)
userRoute.get('/deleteaddress',auth.is_loggedIn,userController.deleteAddress)
userRoute.post('/addtocart',userController.addToCart)
userRoute.post('/selectaddress',userController.buyProductsFromCart)
userRoute.post('/paymentmethod',userController.loadPaymentMethod)
// userRoute.post('/buyproduct',userController.buyProductsFromCart)
userRoute.post('/orderplaced',userController.orderPlaced)
userRoute.get('/cancelorder',auth.is_loggedIn,userController.cancelOrder)
userRoute.get('/removeitem',auth.is_loggedIn,userController.removeFromCart)
userRoute.post('/updateitem',userController.updateItem)
module.exports=userRoute
