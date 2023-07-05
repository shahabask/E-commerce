const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const Product = require("../Model/productModel");
const User = require("../Model/userModel");
const Category = require("../Model/categoryModel");
const Cart = require("../Model/cartModel");
const Order = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");
const Wallet = require("../Model/walletModel");
const Banner = require("../Model/bannerModel");
const { default: mongoose } = require("mongoose");

const securePassword = async (password) => {
  try {
    const saltRound = 10;
    const passwordHash = await bcrypt.hash(password, saltRound);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const sendOTPtoMail = (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.ADMIN_EMAIL,
        pass: config.APP_PASSWORD,
      },
    });
    const mailOptions = {
      from: config.SMTPOWNER,
      to: "shahabasg1@gmail.com",
      subject: "OTP for verifying your email",
      html: `<p> Hi ${name},Use this otp ${otp} to reset your password</p>`,
      text: `Hi ${name},Use this otp ${otp} to reset your password`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Otp has been sent", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegisterForm = (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);

    let characters =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let referralCode = "";

    for (let i = 0; i < 20; i++) {
      let randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters.charAt(randomIndex);
    }
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: spassword,
      isAdmin: false,
      isBlock: false,
      isVerified: 1,
      referralCode: referralCode,
    });
    if (req.body.referralCode) {
      const enteredReferralCode = req.body.referralCode;
      console.log(enteredReferralCode);
      const user = await User.findOne({ referralCode: enteredReferralCode });
      console.log(user);
      if (user && user.referralCodeUsed == 0) {
        let userWallet = await Wallet.findOne({ userId: user._id });
        if (!userWallet) {
          const newWallet = new Wallet({ userId: user._id });
          userWallet = newWallet;
        }
        userWallet.balance += 200;
        userWallet.history.push({
          transactionDate: new Date(),
          amount: 200,
          description: "ReferralOffer",
        });
        user.referralCodeUsed = 1;
        await user.save();
        await userWallet.save();
      }
    }

    const userData = await user.save();
    req.session.userId = userData._id;

    if (userData) {
      res.redirect("/");
    } else {
      res.render("registration", { message: "Submit data failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadLoginForm = (req, res) => {
  try {
    res.render("u-login");
  } catch (error) {
    console.log(error.message);
  }
};
const loadForgetPassword = (req, res) => {
  try {
    
    res.render("forgetpassword");
  } catch (error) {
    console.log(error.message);
  }
};
const loadOtpVerification = async (req, res) => {
  try {
    const email = req.body.email;
    let otp = Math.floor(100000 + Math.random() * 900000);
    otp = otp.toString();
    console.log(otp);
    const userData = await User.findOne({ email: email });
    const otpExpiration = new Date(Date.now() + 1 * 30 * 1000);
    if (userData) {
      userData.otpExpiration = otpExpiration;
      await userData.save()
      const update = await User.updateOne(
        { email: email },
        { $set: { OTP: otp } }
      );

      sendOTPtoMail(userData.firstName, userData.email, userData.OTP);

      res.render("verifyotp",{userData});
    } else {
      res.render("forgetpassword", { message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    var userData = await User.findOne({ OTP: otp });

    const currentTime = new Date();
    if (userData) {
     

      if (currentTime <= userData.otpExpiration) {

        res.render("passwordreset", { userId: userData._id });
        
        // res.render("user/home1");
      }else{
        res.render("verifyotp", { message: "Re-verify your Account",userData:userData });
      }
    } else {
      userData=await User.findOne({email:req.body.email})
      res.render("verifyotp", { message: "Incorrect OTP" ,userData:userData});
    }
  } catch (error) {
    console.log(error.message);
  }
};
const verifyPassword = async (req, res) => {
  try {
    const pass1 = req.body.reset1;
    const pass2 = req.body.reset2;
    const passwordRegex = /^[a-zA-Z0-9_]{6,}$/;
    const spassword = await securePassword(pass1);
    if (!passwordRegex.test(pass1)) {
      res.render("passwordreset", {
        userId: req.body.userId,
        message: "Give a strong password",
      });
    } else {
      if (pass1 == pass2) {
        const updatedata = await User.updateOne(
          { _id: req.body.userId },
          { $set: { password: spassword } }
        );
        res.redirect("/login");
      } else {
        res.render("passwordreset", {
          userId: req.body.userId,
          message: "Confirmation password is incorrect",
        });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    // console.log(userData.isBlock)

    if (userData) {
      const pass = req.body.password;
      const passwordMatch = await bcrypt.compare(pass, userData.password);
      if (passwordMatch) {
        if (userData.isBlock) {
          res.redirect(`/login?message=cannot+access`);
        } else {
          req.session.userId = userData._id;

          //    res.redirect('/?value=' + encodeURIComponent(userData.firstName))
          res.redirect("/");
        }
      } else {
        res.render("u-login", { message: "invalid password" });
      }
    } else {
      res.render("u-login", { message: "user is not valid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const logOut = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

const loadEmailForOtpLogin = (req, res) => {
  try {
    res.render("loademailotplogin");
  } catch (error) {
    console.log(error);
  }
};
const sendOtpForOtpLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
 
    if (userData) {
      const otpExpiration = new Date(Date.now() + 1 * 120 * 1000);
      userData.otpExpiration = otpExpiration;
      await userData.save()
      let otp = Math.floor(100000 + Math.random() * 900000);
      otp = otp.toString();
      console.log(otp);
      const updateOtp = await User.updateOne(
        { email: email },
        { $set: { OTP: otp } }
      );
      sendOTPtoMail(userData.firstName, email, otp);
      res.render("otplogin",{userData});
    } else {
      res.render("loademailotplogin", { message: "invalid user" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const otpLoginVerify = async (req, res) => {
  try {
    const otp = req.body.otp;
   var userData = await User.findOne({ OTP: otp });
    if (userData) {
      const currentTime = new Date();
      
      if (currentTime <= userData.otpExpiration) {
        req.session.userId = userData._id;

        res.redirect("/");
        
        // res.render("user/home1");
      }else{
        res.render("otplogin", { message: "Re-verify your Account",userData });
      }
     
    } else {
     userData=await User.findOne({email:req.body.email})
      res.render("otplogin", { message: "incorrect otp",userData });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadHome = async (req, res) => {
  try {
    const banner = await Banner.findOne({ status: 1 });
    const user = await User.findOne({ _id: req.session.userId });

    const category = await Category.find({});

    const page = parseInt(req.query.page) || 1; // Get the current page from the query parameter

    // Calculate the offset and limit based on the page number and number of products per page
    const productsPerPage = 6; // Number of products to display per page
    const offset = (page - 1) * productsPerPage;

    // Retrieve the products from the database using the offset and limit
    // Retrieve the products from the database using the offset and limit
    const products = await Product.find({ available: true })
      .skip(offset)
      .limit(productsPerPage);
    const productCount = await Product.countDocuments({});
    // Calculate the total number of pages based on the total number of products
    const totalProducts = productCount;
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    if(req.session.userId){
    if (user.isBlock == false) {

           res.render("u-home", {
             products,
             currentPage: page,
             totalPages,
             category: category,
             user: user,
             banner,
           });
      
      // Render the products template with the products and pagination data

      //    res.render('u-home',{products:products,category:category,user:user})
    } else {
      req.session.destroy();

      res.redirect("/");
    }
  }else{
    res.render("u-home", {
      products,
      currentPage: page,
      totalPages,
      category: category,
      user: user,
      banner,
      logout:1
    });
  }
  } catch (error) {
    console.log(error.message);
  }
};

const loadUserProfile = async (req, res) => {
  try {
    const id = req.session.userId;
    const user = await User.findOne({ _id: id });
    res.render("userprofile", {
      admin: false,
      user: user,
      address: user.address,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditProfile = async (req, res) => {
  try {
    const id = req.session.userId;

    const user = await User.findOne({ _id: id });

    res.render("edit-profile", { user: user });
  } catch (error) {
    console.log(error.message);
  }
};

const saveUserProfile = async (req, res) => {
  try {
    const id = req.session.userId;
    console.log(req.file.filename);
    const user = await User.findOne({ _id: req.session.userId });
    const updatedData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      image: user.image,
    };

    if (req.file) {
      updatedData.image = req.file.filename;
    }

    const user1 = await User.updateOne({ _id: id }, { $set: updatedData });
    if (user1) {
      res.redirect("/userprofile");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const index = req.query.index;
    const id = req.session.userId;
    const user = await User.findOne({ _id: id });
    const address = user.address;
    res.render("edit-address", { address: address, index: index });
  } catch (error) {
    console.log(error.message);
  }
};
const updateAddress = async (req, res) => {
  try {
    const index = req.body.index;
    console.log(index);
    const id = req.session.userId;
    const user = await User.findOne({ _id: id });
    const address = req.body;
    user.address.splice(index, 1, {
      head: address.head,
      street: address.street,
      city: address.city,
      landmark: address.landmark,
      pincode: address.pincode,
      state: address.state,
      country: address.country,
    });
    await user.save();
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddAddress = (req, res) => {
  try {
    res.render("add-address");
  } catch (error) {
    console.log(error.message);
  }
};
const saveAddress = async (req, res) => {
  try {
    const id = req.session.userId;
    const user = await User.findOne({ _id: id });
    const address = req.body;
    user.address.push({
      head: address.head,
      street: address.street,
      city: address.city,
      landmark: address.landmark,
      pincode: address.pincode,
      state: address.state,
      country: address.country,
    });
    await user.save();
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};
const deleteAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await User.findOne({ _id: id });
    const index = req.query.index;
    user.address.splice(index, 1);
    await user.save();
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};

const loadUserWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.session.userId });
    res.render("userWallet", { wallet: wallet });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadRegisterForm,
  insertUser,
  loadLoginForm,
  verifyLogin,
  loadForgetPassword,
  loadOtpVerification,
  verifyOtp,
  verifyPassword,
  loadEmailForOtpLogin,
  sendOtpForOtpLogin,
  otpLoginVerify,
  loadHome,
  loadUserProfile,
  loadEditProfile,
  saveUserProfile,
  loadAddAddress,
  saveAddress,
  loadEditAddress,
  updateAddress,
  deleteAddress,
  loadUserWallet,
  logOut,
};
