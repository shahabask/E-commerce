const Product = require("../Model/productModel");
const User = require("../Model/userModel");
const Category = require("../Model/categoryModel");
const Cart = require("../Model/cartModel");
const Order = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");
const Wallet =require('../Model/walletModel');
const Usercoupon=require('../Model/userCouponModel')
const Razorpay = require("razorpay");
const mongoose = require("mongoose");

const instance = new Razorpay({
  key_id: "rzp_test_PyP2RD55w0NgDZ",
  key_secret: "ovSD6fcZOe6IY834dAYvNZCb",
});
const orderPlaced = async (req, res) => {
  try {
    const addressIndex = req.body.addressIndex;
   
    const paymentMethod = req.body.paymentOption;
    const userId = req.session.userId;
    const cart = await Cart.findOne({ userId: userId });

    const user = await User.findOne({ _id: userId });
    const address = user.address[addressIndex];
    const phone = user.phone;
    const email = user.email;
    
    let total = req.body.total;
    console.log(typeof total)
    total = Number(total);

     
    if (total != 0) {
      const userId = req.session.userId;

      const cart = await Cart.findOneAndUpdate(
        { userId: userId },
        { $set: { grandTotal: total } }
      );
    }


    
    let shipping = 0;
    
    if (cart.grandTotal < 1000) {
      shipping = 99;
    }


    let newOrder = new Order({
      userId: req.session.userId,
      products: cart.product,
      paymentMethod: paymentMethod,
      address: address.head,
      phone: phone,
      email: email,
      grandTotal: cart.grandTotal + shipping,
    });
    const order = await newOrder.save();
    //  const order=await Order.find({userId:userId})
    for(let i=0;i<order.products.length;i++){
      let id= order.products[i].productId
      let quantity=order.products[i].quantity
      let product=await Product.findOne({_id:id}) 
      product.quantity-=quantity
      product.save()
    }
   
    const orderId = order._id.toString();
      
    if (paymentMethod == "online-payment") {
      var options = {
        amount: order.grandTotal * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: orderId,
      };
      instance.orders.create(options, async function (err, order) {
        if (!err) {
          await Cart.deleteOne({ userId: userId });
          res.status(200).send({
            success: true,
            msg: "order created",
            amount: order.grandTotal * 100,
            key_id: "rzp_test_PyP2RD55w0NgDZ",
            order: order,
          });
          //   res.send(order)
          // console.log("new order",order);
        } else {
          console.log(err);
        }
      });
    } else if (paymentMethod == "wallet-payment") {
      const wallet=await Wallet.findOne({userId:req.session.userId})
      const walletBalance=wallet.balance
      if(walletBalance>=order.grandTotal){
        await Cart.deleteOne({ userId: userId });
        res.send({codSuccess:true})
      }else{
        await Order.deleteOne({userId:userId})
        res.send({codSuccess:false})
      }

    } else {
      await Cart.deleteOne({ userId: userId });
      setTimeout(function () {
        res.send({ codSuccess: true });
      }, 4000);
    }

    //  setTimeout(function(){
    //    res.redirect('/userorder')
    //  },3000)
  } catch (error) {
    console.log(error.message);
  }
};

const saveEditAddressCheckout = async (req, res) => {
  try {
    const index = req.body.index;
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

    res.render("selectaddress", {
      address: user.address,
      user: user,
      total: "",
    });
  } catch (error) {
    console.log(error.message);
  }
};
const loadPaymentMethod = async (req, res) => {
  try {
    const addressIndex = req.body.addressIndex;
   

    const pipeline = [
      {
        $match: { userId: new mongoose.Types.ObjectId(req.session.userId) },
      },
      {
        $unwind: "$product",
      },
      {
        $lookup: {
          from: "products",
          localField: "product.productId",
          foreignField: "_id",
          as: "productData",
        },
      },
      {
        $unwind: "$productData",
      },
      {
        $project: {
          _id: 0,
          productId: "$productData._id",
          modelName: "$productData.modelName",
          price: "$productData.price",
          description: "$productData.description",
          category: "$productData.category",
          image: { $arrayElemAt: ["$productData.image", 0] },
          quantity: "$product.quantity",
          size: "$product.size",
          color: "$product.color",
          total: { $multiply: ["$product.quantity", "$productData.price"] },
        },
      },
      {
        $group: {
          _id: null,
          products: { $push: "$$ROOT" },
          total: { $sum: "$total" },
        },
      },
    ];

    const cart2 = await Cart.aggregate(pipeline);

    if (cart2.length > 0) {
      const { products, total } = cart2[0];
      let shipping = 0;
      if (total < 2000) {
        shipping = 100;
      }
    
      const grandTotal = total + shipping

      res.render("price-payment", {
        total: total,
        grandTotal: grandTotal,
        shipping: shipping,
        products: products,
        addressIndex: addressIndex,
 
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditAddressCheckout = async (req, res) => {
  try {
    const index = req.query.index;

    const user = await User.findOne({ _id: req.session.userId });
    res.render("editaddresscheckout", { index: index, address: user.address });
  } catch (error) {
    console.log(error.message);
  }
};
const verifyPayment = async (req, res) => {
  try {
    const userId = req.session.userId;
   const payment = req.body.response;

    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha256", "ovSD6fcZOe6IY834dAYvNZCb")
      .update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id)
      .digest("hex");
    if (hash == payment.razorpay_signature) {
      await Cart.deleteOne({ userId: userId });
      res.send({ status: true });
    } else {
      console.log("error......");
      res.send({ status: false });
    }
    res.send("heloo");
  } catch (error) {
    console.log(error.message);
  }
};

const loadUserOrders = async (req, res) => {
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
          price: "$products.price",
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
          paymentMethod: { $push: "$paymentMethod" },
          products: { $push: "$$ROOT" },
        },
      },
    ];

    const orders = await Order.aggregate(pipeline);
    orders.sort((a,b)=> b.products[0].orderDate-a.products[0].orderDate)
    // console.log(orders)

    // console.log('ith total',orders[orders.length-1].products[0].total)
    // console.log(orders[orders.length-1].products[0].total)
    res.render("userorders", { admin: false, orders: orders });
  } catch (error) {
    console.log(error.message);
  }
};
const cancelOrder = async(req, res) => {
  try {
    const orderId = req.query.orderId
      // console.log('nee suparaada',orderId)
      const order=await Order.findOne({_id:orderId})
      // console.log(order,'iniyenkilum nee onn vannirunangil')
      if(order.paymentMethod!='cashOnDelivery'){
        
         let wallet=await Wallet.findOne({userId:req.session.userId})
         if(!wallet){
           const newWallet= new Wallet({userId:req.session.userId})
           await newWallet.save()
           wallet=newWallet
         }
        
         wallet.balance+=order.grandTotal
         wallet.history.push({transactionDate:new Date,amount:order.grandTotal,description:'Cancelled Order'})
         await wallet.save()

      }
      for(let i=0;i<order.products.length;i++){
        let id= order.products[i].productId
        let quantity=order.products[i].quantity
        let product=await Product.findOne({_id:id})
        product.quantity+=quantity
        product.save()
      }
    const cancel = await Order.updateOne(
      { _id: orderId },
      { $set: { status: "cancelled" } }
    );
    res.redirect("/userorder");
  } catch (error) {
    console.log(error.message);
  }
};
const returnOrder = async (req, res) => {
  try {
    const orderId=req.body.orderId
   
    const order=await Order.findOneAndUpdate({_id:orderId},{status:'return-requested'})
   

   res.redirect('/order-details?id=' + orderId)
  } catch (error) {
    console.log(error.message);
  }
};
const orderHistory = (req, res) => {
  try {
  } catch (error) {
    console.log(error.message);
  }
};
const orderDetails = async (req, res) => {
  try {
    const id = req.query.id;
    // const order = await Order.findOne({ _id: id });
    // console.log("ithaanu moone order", order);
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
        // status: { $push: "$status" },
        // paymentMethod: { $push: "$paymentMethod" },
        products: { $push: "$$ROOT" },
      },
    },
    
  ]
  const orders=await Order.aggregate(pipeline)
 const order=orders[0]

 const orderedDate=order.products[0].orderDate
 const currentDate=new Date()
 const differenceMs = currentDate - orderedDate
 var differenceDays = Math.floor(differenceMs / (1000 * 60 * 60 * 24))
 if(differenceDays<=7){

  var returnStatus=true
 }else{
  var returnStatus=false

 }
//  console.log(order.products[0].status)
//   console.log('vannada moone elaam vannu ini pani thodangikko',order)
    res.render("orderDetails", { admin: false, order: order ,returnStatus:returnStatus});
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadUserOrders,
  cancelOrder,
  returnOrder,
  loadEditAddressCheckout,
  saveEditAddressCheckout,
  loadPaymentMethod,
  verifyPayment,
  orderPlaced,
  orderHistory,
  orderDetails,
};
