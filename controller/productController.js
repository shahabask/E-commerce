const Product = require("../Model/productModel");
const User = require("../Model/userModel");
const Category = require("../Model/categoryModel");
const Cart = require("../Model/cartModel");
const Order = require("../Model/orderModel");
const Banner=require('../Model/bannerModel')
const searchProduct=async(req,res)=>{
  try{
    
    const banner = await Banner.findOne({ status: 1 });
    const user = await User.findOne({ _id: req.session.userId });
        const search = req.body.search;
    
        const searchregex = new RegExp(search, "i");
        console.log(req.body.categoryName)
        const page = parseInt(req.query.page) || 1; // Get the current page from the query parameter
        const category = await Category.find({});
        // Calculate the offset and limit based on the page number and number of products per page
        const productsPerPage = 6;
         // Number of products to display per page
        const offset = (page - 1) * productsPerPage;
  
        // Retrieve the products from the database using the offset and limit
        // Retrieve the products from the database using the offset and limit
        var products = await Product.find({ modelName: { $regex: searchregex } }).skip(offset)
        .limit(productsPerPage);
        if(req.body.categoryName){
          var products=await Product.find({ modelName: { $regex: searchregex },category:req.body.categoryName }).skip(offset)
          .limit(productsPerPage);
          var categoryOffer=category.discount
      
        }
        const productCount = await Product.countDocuments({});
        // Calculate the total number of pages based on the total number of products
        const totalProducts = productCount;
        const totalPages = Math.ceil(totalProducts / productsPerPage);
          // var isLogin = req.session.userid ? true : false  
        if (products) {
          if(req.body.categoryName){
            res.render("categoryProduct", { products: products,  currentPage: page,
              totalPages,
              category: category,
              user: user,
              banner,categoryName:req.body.categoryName,categoryOffer });
          }else{
            res.render("u-home", { products: products,  currentPage: page,
              totalPages,
              category: category,
              user: user,
              banner, });
             
          }
          
        } else {
          if(req.body.categoryName){
                 res.render('categoryProduct',{message:"No result found"})
          }else{
             
            res.render("u-home", { message: "No results found" });
          }
        }
     
  }catch(error){
    console.log(error)
  }
}
const filterProducts = async (req, res) => {
  try {
    const color = req.body.color;
    // console.log('this is color',color)
    const minPrice = req.body.minPrice;
    // console.log('this is min price',Number(minPrice) )
    let maxPrice = req.body.maxPrice;
    // console.log('this is max price',Number(maxPrice) )
    let categoryName = req.body.selectedCategory;

    const query = {};

    if (color && color.length > 0) {
      query.color = { $in: color };
    }

    if (Number(minPrice) !== 0) {
      query.price = { $gte: Number(minPrice) };
    }

    if (Number(maxPrice) !== 0) {
      query.price = { $lte: Number(maxPrice) };
    }
    if (Number(maxPrice) !== 0 && Number(minPrice) !== 0) {
      query.price = { $gt: Number(minPrice), $lt: Number(maxPrice) };
    }

    if (categoryName) {
      query.category = categoryName;
      // if(categoryName=='Remove Category'){
      //   query.category={ $ne: '' }
      // }
    }
    //     console.log('this is category',categoryName)
    //  console.log('this is query',query)
    query.available = true;
    const categories = await Category.find({});
    const products = await Product.find(query);
    // console.log(products)
    if (products[0]) {
      const page = parseInt(req.query.page) || 1; // Get the current page from the query parameter

      // Calculate the offset and limit based on the page number and number of products per page
      const productsPerPage = 6; // Number of products to display per page
      const offset = (page - 1) * productsPerPage;

      // Retrieve the products from the database using the offset and limit
      // Retrieve the products from the database using the offset and limit
      const slicedProducts = products.slice(offset, offset + productsPerPage);
      const productCount = products.length;
      // Calculate the total number of pages based on the total number of products
      const totalProducts = productCount;
      const totalPages = Math.ceil(totalProducts / productsPerPage);
      const category=await Category.findOne({category_name:categoryName})
      var categoryOffer=category.discount
      // if(!categoryOffer){
      //   categoryOffer=""
      // }
      if (!categoryName) {
        categoryName = "All";
      }

      res.render("categoryProduct", {
        products: slicedProducts,
        categoryName: categoryName,
        category: categories,
        currentPage: page,
        totalPages,
        categoryOffer
      });
    } else {
      const page = parseInt(req.query.page) || 1; // Get the current page from the query parameter

      // Calculate the offset and limit based on the page number and number of products per page
      const productsPerPage = 6; // Number of products to display per page
      const offset = (page - 1) * productsPerPage;

      // Retrieve the products from the database using the offset and limit
      // Retrieve the products from the database using the offset and limit
      const slicedProducts = products.slice(offset, offset + productsPerPage);
      const productCount = products.length;
      // Calculate the total number of pages based on the total number of products
      const totalProducts = productCount;
      const totalPages = Math.ceil(totalProducts / productsPerPage);
      res.render("categoryProduct", {
        products: "",
        categoryName: categoryName,
        category: categories,
        currentPage: page,
        totalPages,
        message: "No products is left in the category",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadProductDetails = async (req, res) => {
  try {
    const id = req.query.id;
    const category = req.query.category;
    const product = await Product.findOne({ _id: id });
    const size = await Product.distinct("size", { category: category });
    const color = await Product.distinct("color", { category: category });
    const offerPrice=Math.floor((product.price*(100-product.discount))/100)
    // console.log(offerPrice)

    productPrice=offerPrice
    // if(!product.discount){
    //   productPrice=product.price
    // }
    res.render("productdetails", {
      product: product,
      admin: false,
      size: size,
      color: color,
      offerPrice:productPrice
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  // loadCategoryProducts,
  loadProductDetails,
  filterProducts,
  searchProduct,
};
