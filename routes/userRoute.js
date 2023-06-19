const express = require("express");
const userRoute = express();

userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user");

const auth = require("../controller/authController");
const cartController = require("../controller/cartController");
const userController = require("../controller/usercontroller");
const orderController = require("../controller/orderController");
const productController = require("../controller/productController");

const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/userImage"));
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});
const upload = multer({ storage: storage });

userRoute.get("/", auth.isUserLoggedIn, userController.loadHome);

userRoute.get(
  "/register",
  auth.isUserLoggedOut,
  userController.loadRegisterForm
);
userRoute.post("/register", userController.insertUser);

userRoute.get("/login", auth.isUserLoggedOut, userController.loadLoginForm);
userRoute.post("/login", userController.verifyLogin);

userRoute.get(
  "/otploginemail",
  auth.isUserLoggedOut,
  userController.loadEmailForOtpLogin
);
userRoute.post("/otploginemail", userController.sendOtpForOtpLogin);
userRoute.post("/otplogin", userController.otpLoginVerify);

userRoute.get(
  "/forget",
  auth.isUserLoggedOut,
  userController.loadForgetPassword
);
userRoute.post("/forget", userController.loadOtpVerification);
userRoute.post("/verifyotp", userController.verifyOtp);

userRoute.post("/confirm", userController.verifyPassword);

userRoute.post("/filter", productController.filterProducts);
// userRoute.get('/categoryproduct',auth.isUserLoggedIn,productController.loadCategoryProducts)
userRoute.get(
  "/productdetails",
  auth.isUserLoggedIn,
  productController.loadProductDetails
);
userRoute.get(
  "/userprofile",
  auth.isUserLoggedIn,
  userController.loadUserProfile
);

userRoute.get("/usercart", auth.isUserLoggedIn, cartController.getCart);

userRoute.get(
  "/editprofile",
  auth.isUserLoggedIn,
  userController.loadEditProfile
);
userRoute.post(
  "/editprofile",
  upload.single("image"),
  userController.saveUserProfile
);

userRoute.get(
  "/editaddress",
  auth.isUserLoggedIn,
  userController.loadEditAddress
);
userRoute.post("/updateaddress", userController.updateAddress);
userRoute.get(
  "/addaddress",
  auth.isUserLoggedIn,
  userController.loadAddAddress
);
userRoute.post("/saveaddress", userController.saveAddress);
userRoute.get(
  "/deleteaddress",
  auth.isUserLoggedIn,
  userController.deleteAddress
);

userRoute.post("/buyproduct", cartController.buyProductDirectly);
userRoute.post("/addtocart", cartController.addToCart);
userRoute.get(
  "/removeitem",
  auth.isUserLoggedIn,
  cartController.removeFromCart
);
userRoute.post("/updateitem", cartController.updateItem);

userRoute.post("/buyfromcart", cartController.buyProductsFromCart);
userRoute.get(
  "/editaddresscheckout",
  auth.isUserLoggedIn,
  orderController.loadEditAddressCheckout
);
userRoute.post("/editaddresscheckout", orderController.saveEditAddressCheckout);

userRoute.post("/selectaddress", orderController.loadPaymentMethod);
userRoute.post("/verify-payment", orderController.verifyPayment);
userRoute.post("/orderplaced", orderController.orderPlaced);

userRoute.get(
  "/userorder",
  auth.isUserLoggedIn,
  orderController.loadUserOrders
);
userRoute.post('/return-order',orderController.returnOrder)
userRoute.get(
  "/order-history",
  auth.isUserLoggedIn,
  orderController.orderHistory
);
userRoute.get("/cancel-order", orderController.cancelOrder);
userRoute.get(
  "/order-details",
  auth.isUserLoggedIn,
  orderController.orderDetails
);

userRoute.get(
  "/userwallet",
  auth.isUserLoggedIn,
  userController.loadUserWallet
);
userRoute.post("/applycoupon", cartController.applyCoupon);
userRoute.get("/logout", auth.isUserLoggedIn, userController.logOut);

module.exports = userRoute;
