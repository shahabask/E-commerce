const { default: mongoose } = require("mongoose");
const Product = require("../Model/productModel");
const User = require("../Model/userModel");
const Category = require("../Model/categoryModel");
const Cart = require("../Model/cartModel");
const Order = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");
const { urlencoded } = require("body-parser");

const updateItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    // console.log(userId)
    const productIndexInCart = req.body.productId;
    const quantity = req.body.quantity;

    const cart = await Cart.findOne({ userId: userId });
    const productId = cart.product[productIndexInCart].productId;
    // console.log(productId);
    const product = await Product.findOne({ _id: productId });
    if (cart.product[productIndexInCart].quantity < quantity) {
      cart.product[productIndexInCart].total += product.price;
      cart.grandTotal += product.price;
    } else if (cart.product[productIndexInCart].quantity > quantity) {
      cart.product[productIndexInCart].total -= product.price;
      cart.grandTotal -= product.price;
    }
    cart.product[productIndexInCart].quantity = quantity;
    const displayQuantity=cart.product[productIndexInCart].quantity;
    const c = await cart.save();
        res.send({displayQuantity})
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
const getCart = async (req, res) => {
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
          grandTotal: { $sum: "$total" },
        },
      },
    ];

    const cart2 = await Cart.aggregate(pipeline);

    if (cart2.length > 0) {
      const { _id, products, grandTotal } = cart2[0];

      let shippingCharge = 0;
      //  console.log(typeof grandTotal)
      if (grandTotal < 2000) {
        shippingCharge = 100;
      }
      //  console.log(grandTotal)
      //  console.log(shippingCharge)
      res.render("usercart", {
        products: products,
        total: grandTotal,
        shipping: shippingCharge,
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

const  addToCart = async (req, res) => {
  try {
    let proid = req.body.id;
    let prosize = req.body.size;
    let procolor = req.body.color;
    let cart = await Cart.findOne({ userId: req.session.userId });

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

    var product = await Product.findOne({ _id: proid });
    if (existingproductindex == -1) {
      cart.product.push({
        productId: proid,
        price:product.price,
        quantity: 1,
        size: prosize,
        color: procolor,
        total: product.price,
     });
      cart.grandTotal += product.price;
    } else {
      cart.product[existingproductindex].quantity += 1;
      cart.product[existingproductindex].size = req.body.size;
      cart.product[existingproductindex].color = req.body.color;

      cart.product[existingproductindex].total += product.price;
      cart.grandTotal += product.price;
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

const applyCoupon = async (req, res) => {
  try {
    let couponCode = req.body.coupon;
    let total = req.body.total;

    if (couponCode.length > 0) {
      const regexValue = new RegExp(`^${couponCode}$`, "i");

      var coupon = await Coupon.findOne({ couponCode: { $regex: regexValue } });
    }

    //  console.log('this is couponcode',coupon)

    if (coupon) {
      let couponDiscount = coupon.amount;
      total = total - couponDiscount;

      return res.json({ couponDiscount, total });
    } else {
      return res.json("not a valid coupon");
    }
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  buyProductDirectly,
  buyProductsFromCart,
  getCart,
  addToCart,
  updateItem,
  removeFromCart,
  applyCoupon,
};
