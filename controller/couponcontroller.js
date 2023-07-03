const mongoose = require("mongoose");
const Order = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");
const Usercoupon = require("../Model/userCouponModel");
const Cart=require('../Model/cartModel')
const User=require('../Model/userModel')
const applyCoupon = async (req, res) => {
  try {
    let couponCode = req.body.coupon;
    let total = req.body.total;
  

    if (couponCode.length > 0) {
      const regexValue = new RegExp(`^${couponCode}$`, "i");

      var coupon = await Coupon.findOne({ couponCode: { $regex: regexValue } });
    }
    let cart = await Cart.findOne({userId:req.session.userId})
    
    var products =cart.product // Your array of products
  
    var maxPrice = products.reduce((max, product) => {
      return product.price > max ? product.price : max;
    }, 0)
    
    //  console.log('this is couponcode',coupon)
    if (coupon) {
      let couponDiscount =Math.floor((maxPrice*coupon.percentage)/100) ;
      
      const cart=await Cart.findOne({userId:req.session.userId})
      cart.grandTotal-=couponDiscount
     await cart.save()   

      console.log(typeof couponDiscount)
      total = total - couponDiscount;
       console.log(total)
      return res.json({ couponDiscount, total });
    } else {
      return res.json("not a valid coupon");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadMyCoupons = async (req, res) => {
  try {
    const userId = req.session.userId;

    const pipelineForOrder = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.session.userId),
          deliveredDate: { $exists: true }, // Filter only documents with deliveredDate field
        },
      },
      {
        $sort: {
          deliveredDate: -1, // Sort in descending order based on deliveredDate
        },
      },
      {
        $limit: 5, // Retrieve only the first document (latest delivered order)
      },
    ];

    const latestDeliveredOrder = await Order.aggregate(pipelineForOrder);
        console.log(latestDeliveredOrder)
        if(latestDeliveredOrder){
      for(let i=0;i<latestDeliveredOrder.length;i++){

     
      
    if (
      latestDeliveredOrder[i].grandTotal >= 3000 &&
      latestDeliveredOrder[i].couponPassed == false
    ) {
      const today = new Date();
      const minExpiryDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000); 
      if( latestDeliveredOrder[0].grandTotal >= 3000&& latestDeliveredOrder[0].grandTotal <4000){
        var filteredCoupons = await Coupon.find({
          status: "Active",
          expiryDate: { $gte: minExpiryDate },
          percentage:5,
        });
      }else if(latestDeliveredOrder[0].grandTotal >= 4000&& latestDeliveredOrder[0].grandTotal <6000){
        var filteredCoupons = await Coupon.find({
          status: "Active",
          expiryDate: { $gte: minExpiryDate },
          percentage:10,
        });
      }else if(latestDeliveredOrder[0].grandTotal >= 6000&& latestDeliveredOrder[0].grandTotal <8000){
        var filteredCoupons = await Coupon.find({
          status: "Active",
          expiryDate: { $gte: minExpiryDate },
          percentage:15,
        });
      }else if(latestDeliveredOrder[0].grandTotal >= 8000&& latestDeliveredOrder[0].grandTotal <12000){
        var filteredCoupons = await Coupon.find({
          status: "Active",
          expiryDate: { $gte: minExpiryDate },
          percentage:20,
        });
      }else if(latestDeliveredOrder[0].grandTotal >= 12000){
        var filteredCoupons = await Coupon.find({
          status: "Active",
          expiryDate: { $gte: minExpiryDate },
          percentage:25,
        });
      }
    

      if (filteredCoupons.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredCoupons.length);
        const randomCoupon = filteredCoupons[randomIndex];

        let insertCoupon = await Usercoupon.findOne({ userId: userId });
            
        if (!insertCoupon) {
          const newUserCoupon = new Usercoupon({
            userId: new mongoose.Types.ObjectId(req.session.userId),
            coupons: [],
          });
          await newUserCoupon.save();
          insertCoupon = newUserCoupon;
        }
        if (latestDeliveredOrder.couponPassed != true) {
          insertCoupon.coupons.push({
            couponId: randomCoupon._id,
            description:`You Have Won The Coupon 🏆`
          });
          await insertCoupon.save();
          const id=latestDeliveredOrder[0]._id
          const updateOrder= await Order.findOneAndUpdate({_id:id},{$set:{couponPassed:true}})
       
        }
      }
    }   }
  }
    const pipeline = [
      {
        $match: { userId: new mongoose.Types.ObjectId(req.session.userId) },
      },
      {
        $unwind: "$coupons",
      },
      {
        $lookup: {
          from: "coupons",
          localField: "coupons.couponId",
          foreignField: "_id",
          as: "userCoupon",
        },
      },
      {
        $unwind: "$userCoupon",
      },
      {
        $project: {
          _id:0,
          couponCode: "$userCoupon.couponCode",
          description: "$coupons.description",
          expiryDate: "$userCoupon.expiryDate",
          status: "$userCoupon.status",
          used: "$coupons.couponUsed",
          image:"$userCoupon.image"
        },
      },
      {
        $group: {
          _id: null,
          coupons: { $push: "$$ROOT" },
        },
      },
    ];

    let coupon = await Usercoupon.aggregate(pipeline);
    const user=await User.findOne({_id:req.session.userId})
    const referralCode=user.referralCode
    // console.log(typeof coupon)
    // console.log("coupon undenda", coupon)
    if(coupon.length>0) {

      var{ _id, coupons } = coupon[0];
    
      res.render("userCoupon", { coupons: coupons, admin: false,referralCode:referralCode });
    }else{
    
     console.log("coupon ilaanaano nee parayunne")
      res.render("userCoupon",{coupons:coupon,admin:false,referralCode:referralCode})
    }
   

    
  } catch (error) {
    console.log(error.message);
  }
};
const deleteCoupon = async (req, res) => {
  try {
    const userId = req.session.id;
    const id = req.query.id;
   
    const userCoupons = await Usercoupon.findOne({ userId: userId });
    const coupons = userCoupons.coupons;
    const indexToRemove = coupons.findIndex((coupon) => coupon.couponId == id);
    coupons.splice(indexToRemove, 1);
    res.send("deleted successfully");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  applyCoupon,
  loadMyCoupons,
  deleteCoupon,
};
