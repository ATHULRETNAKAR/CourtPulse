const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema')


const productPage = async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.session.user })
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 12;
    const skip = (page - 1) * itemsPerPage;

    const {
      category,
      minPrice,
      maxPrice,
      brand,
      inStock,
      sort,
      search
    } = req.query;



    let filter = { status: { $ne: "Discontinued" } };

    // Search with product, category, brand name
    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i"); // "i" = case-insensitive
      filter.productName = regex;
    }

    // Category filter (can be single or array)
    if (category) {
      const selectedCategories = Array.isArray(category) ? category : [category];
      filter.category = { $in: selectedCategories };
    }


    // Price filter
    if (minPrice || maxPrice) {
      filter['variants'] = {
        $elemMatch: {}
      };

      if (minPrice) filter['variants'].$elemMatch.sellingPrice = { $gte: parseInt(minPrice) };
      if (maxPrice) {
        filter['variants'].$elemMatch.sellingPrice = {
          ...(filter['variants'].$elemMatch.sellingPrice || {}),
          $lte: parseInt(maxPrice)
        };
      }
    }


    // Brand filter (can be single or array)
    if (brand) {
      const selectedBrands = Array.isArray(brand) ? brand : [brand];
      filter.brand = { $in: selectedBrands };
    }

    // Availability
    if (inStock) {
      filter.status = "Available";
    }

    // Sort
    let sortOption = {};
    if (sort === 'priceLowHigh') {
      sortOption['variants.sellingPrice'] = 1;
    } else if (sort === 'priceHighLow') {
      sortOption['variants.sellingPrice'] = -1;
    } else if (sort === 'nameAsc') {
      sortOption.productName = 1;
    } else if (sort === 'nameDesc') {
      sortOption.productName = -1;
    } else {
      sortOption.createdAt = -1;
    }

    // Final query
    const product = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(itemsPerPage)
      .populate('brand category variants');

    // console.log(product)

    const categories = await Category.find({ status: 'Active' });
    const brands = await Brand.find({ status: 'Active' });

    const totalItems = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    res.render('shope', {
      product,
      categories,
      brands,
      currentPage: page,
      totalPages,
      user,
      query: req.query,
      search
    });
  } catch (error) {
    console.error('Error fetching Product:', error);
    res.status(500).send('Internal Server Error');
  }
};


const productDetail = async (req, res) => {
  try {
    const { id } = req.params
    const product = await Product.findById(id)
      .populate('category')

    const categoryid = product.category

    const relatedProducts = await Product.find({ category: categoryid, _id: { $ne: id } })
    const selectedVariant = product.variants[0]
    const user = req.session.user
    res.render('productDetail', {
      user,
      product,
      relatedProducts,
      selectedVariant
    })

  } catch (error) {
    console.error('Error fetching ProductDetail :', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  productPage,
  productDetail
};