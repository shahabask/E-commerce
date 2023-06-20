const express = require("express");
const adminRoute = express();

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");

const auth = require("../controller/authController");
const adminController = require("../controller/admincontroller");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/adminimage"));
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });

adminRoute.get("/", auth.isAdminLoggedOut, adminController.loadLoginAd);
adminRoute.post("/home", adminController.verifyAdmin);
adminRoute.get("/logout", adminController.logOut);

adminRoute.get("/home", auth.isAdminLoggedIn, adminController.loadHome);

adminRoute.get("/forget", adminController.loadForgetPassword);
adminRoute.post("/forget", adminController.verifyMail);

adminRoute.get("/products", adminController.loadProductList);
adminRoute.get("/users", adminController.loadUsersList);
adminRoute.get("/orders", adminController.loadOrdersList);
adminRoute.get("/category", adminController.loadCatogary);

adminRoute.post("/verifyotp", adminController.verifyOtp);
adminRoute.post("/confirm", adminController.verifyPassword);

adminRoute.get("/addproduct",adminController.loadAddProduct);
adminRoute.post(
  "/addproduct",
  upload.array("image", 5),
  adminController.addProduct
);
adminRoute.get("/editproduct", adminController.loadEditProduct);
adminRoute.post(
  "/editproduct",
  upload.array("image", 5),
  adminController.editProduct
);
adminRoute.get("/deleteproduct", adminController.deleteProduct);
adminRoute.get("/add-deleted-product", adminController.addDeletedProduct);
// adminRoute.post('/searchproduct',adminController)

adminRoute.get("/editcategory", adminController.editCategory);
adminRoute.get("/deletecategory", adminController.deleteCategory);
adminRoute.get("/addcategory", adminController.loadAddCategory);
adminRoute.post("/addcategory", adminController.addCategory);
adminRoute.post("/updatecategory", adminController.updateCategory);

adminRoute.get("/block", auth.isAdminLoggedIn, adminController.blockUser);
adminRoute.get("/unblock", auth.isAdminLoggedIn, adminController.unBlockUser);
adminRoute.get(
  "/cancelorder",
  auth.isAdminLoggedIn,
  adminController.cancelOrder
);

// adminRoute.get('/deleteorder',auth.isAdminLoggedIn,adminController.deleteOrder)
adminRoute.post(
  "/edit-status",
  auth.isAdminLoggedIn,
  adminController.editStatus
);

adminRoute.get("/coupon", auth.isAdminLoggedIn, adminController.loadCoupon);
adminRoute.get(
  "/addcoupon",
  auth.isAdminLoggedIn,
  adminController.loadAddCoupon
);
adminRoute.post(
  "/addcoupon",
  upload.single("image"),
  adminController.addCoupon
);
adminRoute.get('/edit-coupon',auth.isAdminLoggedIn,adminController.loadEditCoupon)
adminRoute.post('/edit-coupon',upload.single("image"),adminController.editCoupon)
adminRoute.get(
  "/deletecoupon",
  auth.isAdminLoggedIn,
  adminController.deleteCoupon
);
module.exports = adminRoute;
