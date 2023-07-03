
const mongoose=require('mongoose')
const Product = require("../Model/productModel");
const User = require("../Model/userModel");
const Category = require("../Model/categoryModel");
const Cart = require("../Model/cartModel");
const Order = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");
const { urlencoded } = require("body-parser");

const  updateItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    // console.log(userId)
    const productIndexInCart = req.body.productId;
    const quantity = req.body.quantity;

    const cart = await Cart.findOne({ userId: userId });
    const productId = cart.product[productIndexInCart].productId;
    // console.log(productId);
    const product = await Product.findOne({ _id: productId });
    console.log('PRODUCT',product)
    if(product.discount){

      var offerPrice=Math.floor((product.price*(100-product.discount))/100)
    }else{
      var offerPrice=product.price
    }
    console.log('OFFER PRICE',offerPrice)
    if (cart.product[productIndexInCart].quantity < quantity) {
      cart.product[productIndexInCart].total += offerPrice;
      cart.grandTotal += offerPrice;
    } else if (cart.product[productIndexInCart].quantity > quantity) {
      cart.product[productIndexInCart].total -= offerPrice;
      cart.grandTotal -= offerPrice;
    }
    cart.product[productIndexInCart].quantity = quantity;
    const displayQuantity=cart.product[productIndexInCart].quantity;
    const c = await cart.save();
    const total=c.product[productIndexInCart].total
   const subTotal=c.product[productIndexInCart].quantity*product.price
   const grandTotal=c.grandTotal
   const discount=subTotal-grandTotal
        res.send({displayQuantity,total,subTotal,grandTotal,discount})
    //   await Cart.updateOne(
    //     {userId: new mongoose.Types.ObjectId(userId)},
    //     {$set: {'product.$[elem].quantity': quantity}},
    //     {arrayFilters: [{'elem': Number(productIndexInCart)}]}

    //     )

    //  const cart1 = await Cart.find({userId: new mongoose.Types.ObjectId(userId)})
  } catch (error) {
    res.send({ isOk: false });
    console.log(error.message);
  }
};

const removeFromCart = async (req, res) => {
  try {
    const index = req.query.index;
    const cart = await Cart.findOne({ userId: req.session.userId });
    console.log(cart);
    if (cart.product.length > 1) {
      cart.grandTotal -= cart.product[index].total;
      const removeitem = cart.product.splice(index, 1);

      cart.save();
    } else {
      const removecart = await Cart.deleteOne({ userId: req.session.userId });
    }
    res.redirect("/usercart");
  } catch (error) {}
};
const  getCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.session.userId });
  // console.log('req.session.userId: ', typeof req.session.userId);
  // console.log(cart)
  try {
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
          stock: "$productData.quantity",
          quantity: {
            $cond: {
              if: {
                $or: [
                  { $gt: ["$product.quantity", "$productData.quantity"] },
                  { $eq: ["$productData.quantity", 0] }
                ]
              },
              then: "$productData.quantity",
              else: "$product.quantity"
            }
          },
          size: "$product.size",
          color: "$product.color",
          total: { $multiply: ["$product.quantity", "$productData.price"] },
          discountTotal: { $multiply: ["$product.quantity", "$product.price"] }
        },
      },
      {
        $match: { "quantity": { $gt: 0 } }
      },
      {
        $group: { 
          _id: null,
          products: { $push: "$$ROOT" },
          grandTotal: { $sum: "$total" },
          discountTotal: { $sum: '$discountTotal' }
        },
      },
    ];

    const cart2 = await Cart.aggregate(pipeline);

    if (cart2.length > 0) {
      const { _id, products, grandTotal,discountTotal } = cart2[0];

      let shippingCharge = 0;
      //  console.log(typeof grandTotal)
      if (grandTotal < 2000) {
        shippingCharge = 100;
      }
      //  console.log(grandTotal)
      //  console.log(shippingCharge)
      const discount=grandTotal-discountTotal

      res.render("usercart", {
        products: products,
        total: grandTotal,
        shipping: shippingCharge,
        discount,
        discountTotal

      });
    } else {
      res.render("usercart", {
        message: "Your cart is empty",
        products: "",   
        total: "",
        shipping: "",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addToCart = async (req, res) => {
  try {
    let proid = req.body.id;
    let prosize = req.body.size;
    let procolor = req.body.color;
    let cart = await Cart.findOne({ userId: req.session.userId });
    
    var product = await Product.findOne({ _id: proid });
    const offerPrice=Math.floor((product.price*(100-product.discount))/100)
     var productPrice=offerPrice
  if(!product.discount){
    productPrice=product.price
  }
    if (!cart) {
      let newCart = new Cart({ userId: req.session.userId, product: [] });
      await newCart.save();
      cart = newCart;
    }
    //  console.log( cart.userId);
    const existingproductindex = cart?.product.findIndex(
      (product) =>
        product.productId == proid &&
        product.size == prosize &&
        product.color == procolor
    );
    //  console.log(existingproductindex);

    if (existingproductindex == -1) {
      cart.product.push({
        productId: proid,
        price: productPrice,
        quantity: 1,
        size: prosize,
        color: procolor,
        total:  productPrice,
     });
      cart.grandTotal +=  productPrice;
    } else {
      cart.product[existingproductindex].quantity += 1;
      // cart.product[existingproductindex].size = req.body.size;
      // cart.product[existingproductindex].color = req.body.color;

      cart.product[existingproductindex].total +=  productPrice;
      cart.grandTotal +=  productPrice;
    }
 
    const c = await cart.save();
  

    res.redirect(`/productdetails?id=${proid}`);
  } catch (error) {
    console.log(error.message);
  }
};
const buyProductDirectly = (req, res) => {
  try {
  } catch (error) {
    console.log(error.message);
  }
};
const buyProductsFromCart = async (req, res) => {
  try {
    // const total1=req.body.total
    // console.log(total1)
    // let total = req.body.total;
    // total = Number(total);

     
    // if (total != 0) {
    //   const userId = req.session.userId;

    //   const cart = await Cart.findOneAndUpdate(
    //     { userId: userId },
    //     { $set: { grandTotal: total } }
    //   );
    // }

    const id = req.session.userId;
    const user = await User.findOne({ _id: id });
    const address = user.address;

    res.render("selectaddress", {
      address: address,
      user: user,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addToCartHome=async(req,res)=>{
  try{
  const proid=(req.query.id).trim() 
    
  var product = await Product.findOne({ _id: proid });
 console.log(product)
 
 var offerPrice=Math.floor((product.price*(100-product.discount))/100)
 if(product.discount==0||!product.discount){
    offerPrice=product.price
 }
 console.log(typeof product.discount)
 const color=product.color
 const size=product.size
  let cart = await Cart.findOne({ userId: req.session.userId });

  if (!cart) {
    let newCart = new Cart({ userId: req.session.userId, product: [] });
    await newCart.save();
    cart = newCart;
  }
  //  console.log( cart.userId);
  const existingproductindex = cart?.product.findIndex(
    (product) =>
      product.productId == proid 
  );
  //  console.log(existingproductindex);

  if (existingproductindex == -1) {
    cart.product.push({
      productId: proid,
      price:offerPrice,
      quantity: 1,
      size: size,
      color: color,
      total: offerPrice,
   });
    cart.grandTotal += offerPrice;
    
  } else {
    cart.product[existingproductindex].quantity += 1;
    // cart.product[existingproductindex].size = req.body.size;
    // cart.product[existingproductindex].color = req.body.color;

    cart.product[existingproductindex].total += offerPrice;
    cart.grandTotal += offerPrice;
 
  }

  const c = await cart.save();
  res.send('heloooooo')
  }catch(error){
    console.log(error.message)
  }
}
module.exports = {
  buyProductDirectly,
  buyProductsFromCart,
  getCart,
  addToCart,
  updateItem,
  removeFromCart,
  addToCartHome,
};
