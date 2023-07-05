const nodemailer = require("nodemailer");
const config = require("../config/config");
const Admin = require("../Model/adminModel");
const Product = require("../Model/productModel");
const Category = require("../Model/categoryModel");
const Coupon = require("../Model/couponModel");
const Order = require("../Model/orderModel");
const User = require("../Model/userModel");
const Banner = require("../Model/bannerModel");
const mongoose = require("mongoose");
const sendOtpToMail = (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        order: config.SMTPOWNER,
        pass: config.SMTPKEY,
      },
    });
    const mailOption = {
      from: config.SMTPOWNER,
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
const loadHome = async (req, res) => {
  try {
    //totalSales

    let totalSales = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["returned", "return-requested", "cancelled"] },
        },
      },
      {
        $count: "totalCount",
      },
    ]);
    totalSales = totalSales[0].totalCount;
    // totalRevenue
    let totalRevenue = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["returned", "return-requested", "cancelled"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    // console.log(totalRevenue)
    totalRevenue = totalRevenue[0].total;
    //totalprofit
    let orginalPrice = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["returned", "return-requested", "cancelled"] },
        },
      },
      { $unwind: "$products" },
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
          price: "$productData.price",
          quantity: "$products.quantity",
          total: { $multiply: ["$productData.price", "$products.quantity"] },
        },
      },
      {
        $group: {
          _id: null,
          Total: { $sum: "$total" },
        },
      },
    ]);
    orginalPrice = orginalPrice[0].Total;
    let loss = orginalPrice - totalRevenue;
    let originalProfit = (orginalPrice * 30) / 100;
    let lastProfit = originalProfit - loss;
    let cost = (orginalPrice * 70) / 100;

    const paymentMethod = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["returned", "return-requested", "cancelled"] },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalGrandTotal: { $sum: "$grandTotal" },
        },
      },
    ]);
    var series = encodeURIComponent(
      JSON.stringify(paymentMethod.map((item) => item.totalGrandTotal))
    );
    var labels = encodeURIComponent(
      JSON.stringify(paymentMethod.map((item) => item._id))
    );

    // Get the current month
    // Get the current month
    var currentMonth = new Date().getMonth() + 1; // JavaScript months are zero-based, so add 1

    const salesPerMonthx = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["returned", "return-requested", "cancelled"] },
          orderDate: {
            // $gt: new Date(new Date().getFullYear(), currentMonth - 1, 1),
            $lt: new Date(new Date().getFullYear(), currentMonth, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$orderDate" },
          totalGrandTotal: { $sum: "$grandTotal" },
        },
      },
      {
        $group: {
          _id: null,
          months: {
            $push: {
              month: { $ifNull: ["$_id", currentMonth] },
              totalGrandTotal: { $ifNull: ["$totalGrandTotal", 0] },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          months: {
            $map: {
              input: { $range: [1, 13] },
              as: "month",
              in: {
                month: {
                  $let: {
                    vars: {
                      monthNames: [
                        null,
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ],
                    },
                    in: {
                      $arrayElemAt: ["$$monthNames", "$$month"],
                    },
                  },
                },
                totalGrandTotal: {
                  $let: {
                    vars: {
                      monthData: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$months",
                              cond: { $eq: ["$$this.month", "$$month"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ["$$monthData.totalGrandTotal", 0] },
                  },
                },
              },
            },
          },
        },
      },
    ]);
 const numberOfOrders=await Order.countDocuments()
 console.log(numberOfOrders)
    
  //   if(salesPerMonthx){
  //    var salesPerMonth = salesPerMonthx[0].months;

  //  }
// console.log(salesPerMonthx[0].months)
    var month = encodeURIComponent(
      JSON.stringify(salesPerMonthx[0].months.map((item) => item.month))
    );
    var monthlySales = encodeURIComponent(
      JSON.stringify(salesPerMonthx[0].months.map((item) => item.totalGrandTotal))
    );
   
    console.log(typeof month)
    res.render("a-dashboard", {
      currentPage: "dashboard",
      paymentData: "",
      totalSales,
      totalRevenue,
      lastProfit,
      loss,
      cost,
      series,
      labels,
      month,
      monthlySales,
      numberOfOrders
    });
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
    const user = await User.find({})
  console.log(user)

 
    res.render("a-Users", { user: user, currentPage: "users",});
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
    orders.sort((a, b) => b.products[0].orderDate - a.products[0].orderDate);
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
    res.render("addProduct", { category: category1,currentPage:'products' });
  } catch (error) {
    console.log(error.message);
    res.send(error);
  }
};

const addProduct = async (req, res) => {
  try {
    const category = req.body.category;

    //    var arrayimage=[]
    const categorycheck = await Category.findOne({ category_name: category });
//  console.log('this is size',req.body.size)
//  console.log('this is color',req.body.color)
    // }
   const productName= req.body.name
  const checkProduct =await Product.findOne({modelName:productName})
   
      // console.log(typeof checkProduct)
      // console.log()
    if (categorycheck) {
      if(!checkProduct){
     if(req.body.price>100){
    if(req.body.discount>0&&req.body.discount<10){

      const product = new Product({
        modelName: req.body.name,
        brand: req.body.brand,
        discount: req.body.discount,
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
    }else{
      const category=await Category.find({})
      res.render('addProduct',{message:"Enter Percentage Below 10",category:category,currentPage:'addproduct',err:1})
    }
     }else{
      const category=await Category.find({})
      res.render('addProduct',{message:"Enter Price Above 100",category:category,currentPage:'addproduct',err:2})
     }
      }else{
        const category=await Category.find({})
        res.render('addProduct',{message:"product is already added",category:category,currentPage:'addproduct',err:3})
      }
    } else {
      res.render("addProduct", {
        message: "product is not in category, please add it to category",
        category: "",currentPage:'addproduct'
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
    // console.log("sdsdsds");
    res.render("addcategory", { message: "" });
  } catch (error) {
    console.log(error.message);
  }
};
const updateCategory = async (req, res) => {
  try {
    const id = req.body.categoryId;
    const name = req.body.categoryName;
    const discount = req.body.categoryDiscount;
    const checkCategory = await Category.findOne({
      category_name: { $regex: new RegExp('^' + name + '$', 'i') },
      _id: { $ne: id }
    })
    if(!checkCategory){

      const update = await Category.updateOne(
        { _id: id },
        { $set: { category_name: name, discount: discount } }
      );
      res.redirect("/admin/category");
    }else{
      const category = await Category.findOne({_id: id})
      res.render('editcategory',{message:'category is already defined', category: category})
    }

  } catch (error) {
    console.log(error);
  }
};
const addCategory = async (req, res) => {
  try {
    const categoryNames = req.body.categoryName;
    const categoryDiscounts = req.body.categoryDiscount;
    for (let i = 0; i < categoryNames.length; i++) {
      const categoryName = categoryNames[i];
      const discount = categoryDiscounts[i];
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
          discount: discount,
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
  //  const id=req.body.userId
  //  console.log(id)
  //   if(req.body.checked==true){
  //     await User.updateOne({_id:id},{$set:{isBlock:false}})
  //   }else{
  //     await User.updateOne({_id:id},{$set:{isBlock:true}})
  //   }

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

    const product = await Product.findOne({ _id: id });
    var productColors = encodeURIComponent(
      JSON.stringify(product.color.map((item) => item)) );
      var productSizes = encodeURIComponent(
        JSON.stringify(product.size.map((item) => item)) );
     
    const category = await Category.find({});
    res.render("editproduct", { product: product, category: category,productColors,productSizes,currentPage:'products',err:'' });
  } catch (error) {
    console.log(error.message);
  }
};
const editProduct = async (req, res) => {
  try {
    const id = req.body.id;
  
    const currentProduct = await Product.findOne({ _id: id });
    const checkProduct = await Product.findOne({
      modelName: req.body.name,
      _id: { $ne: id }
    })
    const  product=await Product.findOne({_id:id})
    var productColors = encodeURIComponent(
      JSON.stringify(product.color.map((item) => item)) );
      var productSizes = encodeURIComponent(
        JSON.stringify(product.size.map((item) => item)) );
        const category=await Category.find({})
    if(!checkProduct){
         if(req.body.price>100){
   if(req.body.discount<10){

     let updateField = {
       modelName: req.body.name,
       brand: req.body.brand,
       discount: req.body.discount,
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
 
       res.redirect("/admin/products");
   }else{
    res.render("editproduct", {message:"Enter percentage below 10", product: product, category: category,productColors,productSizes,currentPage:'products', err:1 });
   }
         }else{
          res.render("editproduct", {message:"Enter price above 100", product: product, category: category,productColors,productSizes,currentPage:'products',err:2 });

         }
    }else{

      res.render('editproduct',{message:"Change the product name, It's already there.",product:product,category: category,productColors,productSizes,currentPage:'products',err:3})
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
    const orderId = req.query.id;
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
    const orderId = req.body.orderId;
    const status = req.body.status;

    if (status == "delivered") {
      const updateStatus = await Order.updateOne(
        { _id: orderId },
        { $set: { status: status, deliveredDate: new Date() } }
      );
    }
    if (status != undefined && status != "delivered") {
      const updateStatus = await Order.updateOne(
        { _id: orderId },
        { $set: { status: status } }
      );
    }

    res.redirect("/admin/orders");
  } catch (error) {
    console.log(error.message);
  }
};
const returnRequest = async (req, res) => {
  try {
    const id = req.body.id;
    const status = req.body.action;
    console.log(req.body.action);
    console.log(req.body.id);
    const updateOrder = await Order.updateOne(
      { _id: id },
      { $set: { status: status } }
    );
    res.send("successfull");
  } catch (error) {
    console.log(error.message);
  }
};

const loadCoupon = async (req, res) => {
  try {
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
    res.render("addCoupon", { currentPage: "" ,err:''});
  } catch (error) {
    console.log(error.message);
  }
};
const  addCoupon = async (req, res) => {
  try {
    const image = req.file.filename;
    console.log(image);
    const checkCoupon = await Coupon.findOne({
      couponCode: { $regex: '^' + req.body.code + '$', $options: 'i' },
      $expr: { $eq: [ { $strLenCP: "$couponCode" }, req.body.code.length ] }
    })
    console.log(checkCoupon)
 if(!checkCoupon){
     if(req.body.percentage<=25){

       const coupon = new Coupon({
         couponCode: req.body.code,
         percentage: req.body.percentage,
         description: req.body.description,
         startingDate:req.body.startingDate,
         expiryDate: req.body.expiryDate,
         
         image: req.file.filename,
       });
       await coupon.save();
       console.log(coupon)
       res.redirect("/admin/coupon");
     }else{
      res.render('addCoupon',{message:"percentage can't exceed 25",currentPage:'',err:2 })
     }

 }else{
  res.render('addCoupon',{message:"can't add existing couponCode",currentPage:"",err:1})
 }
    
  } catch (error) {
    console.log(error.message);
  }
};
const loadEditCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    const coupon = await Coupon.findOne({ _id: id });
    res.render("editCoupon", { coupon: coupon, currentPage: "",err:'' });
  } catch (error) {
    console.log(error.message);
  }
};
const editCoupon = async (req, res) => {
  try {
    const id = req.body.couponId;

    const coupon = await Coupon.findOne({ _id: id });
    // const checkIdentical=await Coupon.findOne({couponCode:req.body.code, _id: { $ne: id }})
    const checkCoupon = await Coupon.findOne({
      couponCode: { $regex: '^' + req.body.code + '$', $options: 'i' },
      $expr: { $eq: [ { $strLenCP: "$couponCode" }, req.body.code.length ] },_id: { $ne: id }
    })
    if(!checkCoupon ){
      if(req.body.percentage<=25){

        const updatedCoupon = {
          couponCode: req.body.code,
          percentage: req.body.percentage,
          description: req.body.description,
          expiryDate: req.body.expiryDate,
          image: coupon.image,
          status: coupon.status,
        };
        const date = new Date(req.body.expiryDate);
        const now = new Date();
        if (date > now) {
          updatedCoupon.status = "Active";
        }
    
        if (req.file) {
          updatedCoupon.image = req.file.filename;
        }
        const couponUpdate = await Coupon.updateOne(
          { _id: id },
          { $set: updatedCoupon }
        );
        res.redirect("/admin/coupon");
      }else{
        res.render('editCoupon',{message:"can't exceed 25 percentage",err:1,coupon: coupon, currentPage: "" })
      }
    }else{
      res.render('editCoupon',{message:"can't add existing couponCode",err:2,coupon: coupon, currentPage: "" })
    }
  } catch (error) {
    console.log(error.message);
  }
};
const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    const deleteCoupon = await Coupon.deleteOne({ _id: id });
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error.message);
  }
};
const loadBannerManagement = async (req, res) => {
  try {
    const banner = await Banner.find({});
    res.render("bannerManagement", { currentPage: "banner", banner: banner });
  } catch (error) {
    console.log(error.message);
  }
};
const uploadBannerImage = async (req, res) => {
  try {
    const banner = new Banner({
      image: req.file.filename,
    });
    await banner.save();

    res.redirect("/admin/banner");
  } catch (error) {
    console.log(error.message);
  }
};
const changeBanner = async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.query.id.trim());
    const status = req.query.status;

    if (status == 1) {
      var otherStatus = 0;
   

    const otherBannerUpdate = await Banner.updateMany(
      { _id: { $ne: id } },
      { $set: { status: otherStatus } }
    );
  } 
    const updateBanner = await Banner.findOneAndUpdate(
      { _id: id },
      { $set: { status: status } }
    );

    res.send("successfull");
  } catch (error) {
    console.log(error.message);
  }
};
const deleteBanner = async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.query.id.trim());
    const deleteBanner = await Banner.deleteOne({ _id: id });

    res.send("successfull");
  } catch (error) {
    console.log(error.message);
  }
};
const loadSalesReport=async(req,res)=>{
  try{
    const todaysales = new Date();
    const startOfDay = new Date(
      todaysales.getFullYear(),
      todaysales.getMonth(),
      todaysales.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDay = new Date(
      todaysales.getFullYear(),
      todaysales.getMonth(),
      todaysales.getDate(),
      23,
      59,
      59,
      999
    );
    const pipeline1=[ {
      $match: {
        status: { $in: ["pending", "delivered", "shipped"] },

        orderDate: {
          $gte: startOfDay, // Set the current date's start time
          $lt: endOfDay,
        },
      },
    },
    {
    $unwind:'$products'
    },
    {
      $lookup:{
        from:'products',
        localField:'products.productId',
        foreignField:'_id',
        as:'productData'
      }
    },
    {
     $unwind:'$productData'
    },
    {

      $project:{
        _id:0,
        name:'$productData.modelName',
        quantity:'$products.quantity',
        total:'$products.total',
        productId: '$products.productId'
      }
    },
    {
      $group: {
        _id: '$productId',
        productName:{ $push: "$$ROOT" },
        totalAmount: { $sum: "$total" },
        quantity:{$sum:'$quantity'}
      },
    }

     ]
    const dailyOrders=await Order.aggregate(pipeline1)
    // const {_id,productName,totalAmount,quantity}=dailyOrders
 
    //weeklyproduct

    const currentDate = new Date();

    // Calculate the start and end dates of the current week
    const startOfWeek = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - currentDate.getDay()
    );
    const endOfWeek = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + (6 - currentDate.getDay()),
      23,
      59,
      59,
      999
    );

    const pipeline2=[ {
      $match: {
        status: { $in: ["pending", "delivered", "shipped"] },

        orderDate: {
          $gte: startOfWeek, // Set the current date's start time
          $lt: endOfWeek,
        },
      },
    },
    {
    $unwind:'$products'
    },
    {
      $lookup:{
        from:'products',
        localField:'products.productId',
        foreignField:'_id',
        as:'productData'
      }
    },
    {
     $unwind:'$productData'
    },
    {

      $project:{
        _id:0,
        name:'$productData.modelName',
        quantity:'$products.quantity',
        total:'$products.total',
        productId: '$products.productId'
      }
    },
    {
      $group: {
        _id: '$productId',
        productName:{ $push: "$$ROOT" },
        totalAmount: { $sum: "$total" },
        quantity:{$sum:'$quantity'}
      },
    }

     ]
     const weeklyOrders=await Order.aggregate(pipeline2)
    

     //monthlySales

     const thisMonth = new Date().getMonth() + 1;
     const startofMonth = new Date(
       new Date().getFullYear(),
       thisMonth - 1,
       1,
       0,
       0,
       0,
       0
     );
     const endofMonth = new Date(
       new Date().getFullYear(),
       thisMonth,
       0,
       23,
       59,
       59,
       999
     );

     const pipeline3=[ {
      $match: {
        status: { $in: ["pending", "delivered", "shipped"] },

        orderDate: {
          $gte: startofMonth, // Set the current date's start time
          $lt: endofMonth,
        },
      },
    },
    {
    $unwind:'$products'
    },
    {
      $lookup:{
        from:'products',
        localField:'products.productId',
        foreignField:'_id',
        as:'productData'
      }
    },
    {
     $unwind:'$productData'
    },
    {

      $project:{
        _id:0,
        name:'$productData.modelName',
        quantity:'$products.quantity',
        total:'$products.total',
        productId: '$products.productId'
      }
    },
    {
      $group: {
        _id: '$productId',
        productName:{ $push: "$$ROOT" },
        totalAmount: { $sum: "$total" },
        quantity:{$sum:'$quantity'}
      },
    }

     ]
     const monthlyOrders=await Order.aggregate(pipeline3)


     //yearlysales

     const today = new Date().getFullYear();
     const startofYear = new Date(today, 0, 1, 0, 0, 0, 0);
     const endofYear = new Date(today, 11, 31, 23, 59, 59, 999);

     const pipeline4=[ {
      $match: {
        status: { $in: ["pending", "delivered", "shipped"] },

        orderDate: {
          $gte: startofYear, // Set the current date's start time
          $lt: endofYear,
        },
      },
    },
    {
    $unwind:'$products'
    },
    {
      $lookup:{
        from:'products',
        localField:'products.productId',
        foreignField:'_id',
        as:'productData'
      }
    },
    {
     $unwind:'$productData'
    },
    {

      $project:{
        _id:0,
        name:'$productData.modelName',
        quantity:'$products.quantity',
        total:'$products.total',
        productId: '$products.productId'
      }
    },
    {
      $group: {
        _id: '$productId',
        productName:{ $push: "$$ROOT" },
        totalAmount: { $sum: "$total" },
        quantity:{$sum:'$quantity'}
      },
    }

     ]
     const yearlyOrders=await Order.aggregate(pipeline4)
      res.render('salesReport',{currentPage:'salesReport',dailyOrders,weeklyOrders,monthlyOrders,yearlyOrders})
  }catch(error){
    console.log(error.message)
  }
}
const deleteProductImage=async(req,res)=>{
  try{
  const index=req.body.index
  const product=await Product.findOne({_id:req.body.productId})
  product.image.splice(index,1)
  await product.save()
  res.send('successfull')

  }catch(error){
    console.log(error.message)
  }
}

const viewOrderDetails=async(req,res)=>{
  try{
 const id=req.query.id
 const pipeline=[ {
  $match:{_id: new mongoose.Types.ObjectId(id)}
  },
  {
    $unwind:'$products'
  },
  {
    $lookup:{
      from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productData",
    }
  },
  {
    $unwind: "$productData",
  },
  {
    $project: {
      _id: 1,
      status: 1,
      grandTotal: 1,
      email: 1,
      phone: 1,
      address: 1,
      paymentMethod: 1,
      orderDate: 1,
      discount: 1,
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
      status: { $push: "$status" },
      // paymentMethod: { $push: "$paymentMethod" },
      products: { $push: "$$ROOT" },
    },
  },
  
]
const orders=await Order.aggregate(pipeline)
const order=orders[0]
 res.render('a-orderdetails',{order:order,orderStatus:'',admin:true,currentPage:''})
  }catch(error){
     console.log(error.message)
  }
}
module.exports = {
  //admin
  loadLoginAd,
  loadForgetPassword,
  verifyAdmin,
  verifyMail,
  verifyOtp,
  verifyPassword,
  adminLogOut,
  loadHome,
  logOut,

  //salesReport
  loadSalesReport,
  

  //user
  loadUsersList,
  blockUser,
  unBlockUser,

  //product
  loadProductList,
  loadAddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
  deleteProduct,
  addDeletedProduct,
  deleteProductImage,

  //order
  loadOrdersList,
  cancelOrder,
  deleteOrder,
  editStatus,
  returnRequest,
  viewOrderDetails,
  //category
  loadCatogary,
  loadAddCategory,
  addCategory,
  editCategory,
  updateCategory,
  deleteCategory,

  //coupon
  loadCoupon,
  loadAddCoupon,
  addCoupon,
  loadEditCoupon,
  editCoupon,
  deleteCoupon,

  //bannerManagement
  loadBannerManagement,
  uploadBannerImage,
  changeBanner,
  deleteBanner,
};
