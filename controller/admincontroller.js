const nodemailer = require("nodemailer");
const config = require("../config/config");
const Admin = require("../Model/adminModel");
const Product = require("../Model/productModel");
const Category = require("../Model/categoryModel");
const Coupon = require("../Model/couponModel");
const Order = require("../Model/orderModel");
const User = require("../Model/userModel");
const sendOtpToMail = (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        order: config.smtpOwner,
        pass: config.smtpKey,
      },
    });
    const mailOption = {
      from: config.smtpOwner,
      to: email,
      subject: "OTP for admin",
      html: `use this otp ${otp} for reseting password`,
      text: `use this otp ${otp} for reseting password`,
    };
    transporter.sendMail(mailOption, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log("otp send successfully", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLoginAd = (req, res) => {
  try {
    res.render("a-login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyAdmin = async (req, res) => {
  try {
    const email = req.body.email;
    const adminData = await Admin.findOne({ email: email });
    if (adminData) {
      const pass = req.body.password;
      if (adminData.password == pass) {
        req.session.admin_id = adminData._id;
        res.redirect("/admin/home");
      } else {
        res.render("a-login", { message: "incorrect password" });
      }
    } else {
      res.render("a-login", { message: "invalid user" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const adminLogOut = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
const loadForgetPassword = (req, res) => {
  try {
    res.render("a-forgetpass");
  } catch (error) {
    console.log(error.message);
  }
};
const verifyMail = async (req, res) => {
  try {
    const email = req.body.email;
    const adminData = await Admin.findOne({ email: email });
    if (adminData) {
      let otp = Math.floor(100000 + Math.random() * 900000);
      otp = otp.toString();
      const updateOtp = await Admin.updateOne(
        { email: email },
        { $set: { OTP: otp } }
      );
      sendOtpToMail(email, otp);
      res.render("a-verifyotp");
    } else {
      res.render("a-forgetpass", { message: "invalid order" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const adminData = await Admin.findOne({ OTP: otp });
    if (adminData) {
      res.render("a-resetpass", { admin_id: adminData._id });
    } else {
      res.render("a-verifyotp", { message: "incorrect otp" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const verifyPassword = async (req, res) => {
  try {
    const admin_id = req.body.admin_id;
    const pass1 = req.body.reset1;
    const pass2 = req.body.reset2;
    if (pass1 == pass2) {
      const updateData = await Admin.updateOne(
        { _id: admin_id },
        { $set: { password: pass1 } }
      );
      res.redirect("/admin");
    } else {
      res.render("a-resetpass", {
        admin_id: admin_id,
        message: "confirmation password is incorrect",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadHome = (req, res) => {
  try {
    res.render("a-dashboard", { currentPage: "dashboard" });
  } catch (error) {
    console.log(error.message);
  }
};
const logOut = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
const loadProductList = async (req, res) => {
  try {
    const product = await Product.find({});
    res.render("a-products", { product: product, currentPage: "products" });
  } catch (error) {
    console.log(error.message);
  }
};
const loadUsersList = async (req, res) => {
  try {
    const user = await User.find({});
    res.render("a-Users", { user: user, currentPage: "users" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrdersList = async (req, res) => {
  try {
    const pipeline = [
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productData",
        },
      },
      {
        $unwind: "$productData",
      },
      {
        $project: {
          _id: 1,
          userid: 1,
          status: 1,
          grandTotal: 1,
          email: 1,
          phone: 1,
          address: 1,
          paymentMethod: 1,
          orderDate: 1,
          name: "$productData.modelName",
          productId: "$productData.description",
          quantity: "$products.quantity",
          price: "$productData.price",
          size: "$products.size",
          color: "$products.color",
          total: "$products.total",
          image: { $arrayElemAt: ["$productData.image", 0] },
        },
      },
      {
        $group: {
          _id: "$_id",
          // grandTotal:{$sum:'$total'},
          products: { $push: "$$ROOT" },
        },
      },
    ];

    const orders = await Order.aggregate(pipeline);
    orders.sort((a,b)=>b.products[0].orderDate-a.products[0].orderDate)
    res.render("a-orders", { orders: orders, currentPage: "orders" });
  } catch (error) {
    console.log(error.message);
  }
};
const loadAddProduct = async (req, res) => {
  try {
    console.log("ninnnnn");
    const category1 = await Category.find({}).lean().exec();
    console.log(category1[0]);
    res.render("addProduct", { category: category1 });
  } catch (error) {
    console.log(error.message);
    res.send(error)
  }
};

const addProduct = async (req, res) => {
  try {
    const category = req.body.category;

    //    var arrayimage=[]
    const categorycheck = await Category.findOne({ category_name: category });

    // }
    if (categorycheck) {
      const product = new Product({
        modelName: req.body.name,
        brand: req.body.brand,
        category: req.body.category,
        quantity: req.body.quantity,
        price: req.body.price,
        size: req.body.size,
        description: req.body.description,
        image: req.files.map((file) => file.filename),
        color: req.body.color,
      });
      const productadd = await product.save();
      res.redirect("/admin/products");
    } else {
      res.render("addProduct", {
        message: "product is not in category, please add it to category",
        category: "",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadCatogary = async (req, res) => {
  try {
    const category = await Category.find({});
    res.render("categorymanagement", {
      category: category,
      currentPage: "category",
    });
  } catch (error) {
    console.log(error.message);
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.findOne({ _id: id });
    res.render("editcategory", { category: category });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;

    const Delete = await Category.deleteOne({ _id: id });
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddCategory = (req, res) => {
  try {
    console.log('sdsdsds');
    res.render("addcategory", { message: "" });
  } catch (error) {
    console.log(error.message);
  }
};
const updateCategory = async (req, res) => {
  try {
    const id = req.body.categoryId;
    console.log("id:", id);
    const name = req.body.categoryName;
    console.log(name);
    const update = await Category.updateOne(
      { _id: id },
      { $set: { category_name: name } }
    );
    console.log(update);
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
  }
};
const addCategory = async (req, res) => {
  try {
    const categoryNames = req.body.categoryName;

    for (let i = 0; i < categoryNames.length; i++) {
      const categoryName = categoryNames[i];
      console.log(categoryName);
      const checkCategory = await Category.findOne({
        category_name: { $regex: categoryName, $options: "i" },
      });
      console.log(checkCategory);
      if (checkCategory) {
        res.render("addcategory", { message: "category is already defined" });
      } else {
        const category = new Category({
          category_name: categoryName,
        });
        await category.save();
      }

      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const blockUser = async (req, res) => {
  try {
    const id = req.query.id;

    await User.updateOne({ _id: id }, { $set: { isBlock: true } });

    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};

const unBlockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlock: false } });
    const user = await User.findOne({ _id: id });
    // console.log(user.isBlock)
    res.redirect("/admin/users");
  } catch (error) {}
};
const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);

    const product = await Product.findOne({ _id: id });
    console.log(product);
    const category = await Category.find({});
    res.render("editproduct", { product: product, category: category });
  } catch (error) {
    console.log(error.message);
  }
};
const editProduct = async (req, res) => {
  try {
    const id = req.body.id;

    const currentProduct = await Product.findOne({ _id: id });
    let updateField = {
      modelName: req.body.name,
      brand: req.body.brand,
      category: req.body.category,
      quantity: req.body.quantity,
      price: req.body.price,
      size: req.body.size,
      description: req.body.description,
      image: currentProduct.image,
      color: req.body.color,
    };
    if (req.files && req.files.length > 0) {
      updateField.image = req.files.map((file) => file.filename);
    }

    const product = await Product.findByIdAndUpdate(
      { _id: id },
      { $set: updateField }
    );
    if (product) {
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};
const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const softDelete = await Product.findOneAndUpdate(
      { _id: id },
      { available: false }
    );
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};
const addDeletedProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const add = await Product.findOneAndUpdate(
      { _id: id },
      { available: true }
    );
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await Order.updateOne(
      { _id: orderId },
      { $set: { status: "cancelled" } }
    );
    res.redirect("/admin/orders");
  } catch (error) {
    console.log(error.message);
  }
};
const deleteOrder = async (req, res) => {
  try {
    const size = req.query.size;
    const color = req.query.color;
    const userid = req.query.userid;
    const productName = req.query.name;
    const order = await Order.deleteOne({
      userid: userid,
      color: color,
      size: size,
      name: productName,
    });
    res.redirect("/admin/orders");
  } catch (error) {
    console.log(error.message);
  }
};

const editStatus = async (req, res) => {
  try {
    const orderId = req.body.orderid;
    const status = req.body.statusSelect;

    const updateStatus = await Order.updateOne(
      { _id: orderId },
      { $set: { status: status } }
    );
    res.redirect("/admin/orders");
  } catch (error) {
    console.log(error.message);
  }
};

const loadCoupon = async (req, res) => {
  try {
    const coupon = [
      {
        code: "fegert",
        description: "heflg",
        expiryDate: "1/02/20223",
        status: "Active",
      },
      {
        code: "feterh",
        description: "heflg",
        expiryDate: "1/02/20223",
        status: "Expired",
      },
      {
        code: "feggrt",
        description: "heflg",
        expiryDate: "1/02/20223",
        status: "Active",
      },
      {
        code: "feggrt",
        description: "heflg",
        expiryDate: "1/02/20223",
        status: "Active",
      },
    ];
    const coupons = await Coupon.find({});
    const currentDate = new Date();
    for (const coupon of coupons) {
      if (coupon.expiryDate <= currentDate) {
        coupon.status = "Expired";
        await coupon.save(); // Save the updated coupon document
      }
    }
    // const currentDate = new Date();
    // const comparison = await orderModel.findById(filter)
    // const productDeliveredDate = comparison.delivered.deliveredDate;

    // const comparingDate = currentDate.getTime() - productDeliveredDate.getTime()

    // const productReturnValidation = Math.floor(comparingDate / (1000 * 60 * 60 * 24))
    res.render("couponManagement", { currentPage: "coupon", coupons: coupons });
  } catch (error) {
    console.log(error.message);
  }
};
const loadAddCoupon = (req, res) => {
  try {
    // const currentDate = new Date();
    // const expiryDate =req.body.

    res.render("addCoupon", { currentPage: "" });
  } catch (error) {
    console.log(error.message);
  }
};
const addCoupon = async (req, res) => {
  try {
    const image = req.file.filename;
    console.log(image);

    const coupon = new Coupon({
      couponCode: req.body.code,
      amount: req.body.amount,
      description: req.body.description,
      expiryDate: req.body.expiryDate,
      image: req.file.filename,
    });
    await coupon.save();
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error.message);
  }
};
const loadEditCoupon=async(req,res)=>{
  try{
    const id=req.query.id
    const coupon=await Coupon.findOne({_id:id})
    console.log(coupon)
    res.render('editCoupon',{coupon:coupon,currentPage:''})

  }catch(error){
       console.log(error.message)
  }
}
const editCoupon=async(req,res)=>{
  try{

  }catch(error){
    console.log(error.message)

  }
}
const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    const deleteCoupon = await Coupon.deleteOne({ _id: id });
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
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
  addDeletedProduct,
  loadEditProduct,
  blockUser,
  unBlockUser,
  cancelOrder,
  deleteOrder,
  editStatus,
  loadCoupon,
  loadAddCoupon,
  addCoupon,
  loadEditCoupon,
  editCoupon,
  deleteCoupon,
};
