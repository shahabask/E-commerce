const Product = require("../Model/productModel");
const User = require("../Model/userModel");
const Category = require("../Model/categoryModel");
const Cart = require("../Model/cartModel");
const Order = require("../Model/orderModel");

// const loadCategoryProducts=async(req,res)=>{
//     try{
//     const products=req.query.products
//     console.log(req.query)
//     console.log('this is:',products[0])
//       // const category=await Category.find({})
//       if(products[0]){
//         res.render('categoryProduct',{products:products})
//       }else{
//         res.render('categoryProduct',{message:'No product is remaining',})
//       }

//     }catch(error){
//         console.log(error.message)

//     }
// }
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
      if (!categoryName) {
        categoryName = "All";
      }

      res.render("categoryProduct", {
        products: slicedProducts,
        categoryName: categoryName,
        category: categories,
        currentPage: page,
        totalPages,
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
    res.render("productdetails", {
      product: product,
      admin: false,
      size: size,
      color: color,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  // loadCategoryProducts,
  loadProductDetails,
  filterProducts,
};
