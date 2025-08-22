const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema')


const productPage = async (req, res) => {
  try {
    // Fetch user if needed
    let user = await User.findOne({ _id: req.session.user });

    // Extract query parameters
    const {
      page = 1,
      limit = 12, // Match frontend's 12 products per page
      category,
      minPrice,
      maxPrice,
      brand,
      inStock,
      sort,
      search,
      ratings // Added to support ratings filter
    } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    let filter = { status: { $ne: "Discontinued" } };

    // Search filter
    if (search && search.trim().length > 0) {
      filter.productName = { $regex: search.trim(), $options: 'i' };
    }

    // Category filter
    if (category) {
      const selectedCategories = Array.isArray(category) ? category : [category];
      filter.category = { $in: selectedCategories };
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter['variants'] = { $elemMatch: {} };
      if (minPrice) filter['variants'].$elemMatch.sellingPrice = { $gte: parseInt(minPrice) };
      if (maxPrice) {
        filter['variants'].$elemMatch.sellingPrice = {
          ...(filter['variants'].$elemMatch.sellingPrice || {}),
          $lte: parseInt(maxPrice)
        };
      }
    }

    // Ratings filter
    if (ratings) {
      filter.ratings = { $gte: parseInt(ratings) };
    }

    // Brand filter
    if (brand) {
      const selectedBrands = Array.isArray(brand) ? brand : [brand];
      filter.brand = { $in: selectedBrands };
    }

    // Availability filter
    if (inStock === 'true') {
      filter['variants.stock'] = { $gt: 0 }; // Use stock in variants instead of status
    }

    // Sorting logic
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
      sortOption.createdAt = -1; // Default sort by newest
    }

    // Fetch products with pagination
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('brand category')
      .lean(); // Use lean for better performance

    // Get total count of matching products
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNum);

    // Check if request is AJAX
    if (req.xhr) {
      // Return JSON for AJAX requests
      return res.json({
        products,
        totalProducts
      });
    }

    // Fetch categories and brands for rendering
    const categories = await Category.find({ status: 'Active' }).lean();
    const brands = await Brand.find({ status: 'Active' }).lean();

    // Render EJS template for non-AJAX requests
    res.render('shope', {
      product: products,
      totalProducts,
      categories,
      brands,
      currentPage: pageNum,
      totalPages,
      user,
      query: req.query,
      search
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    if (req.xhr) {
      return res.status(500).json({ error: 'Error fetching products' });
    }
    res.status(500).send('Internal Server Error');
  }
};


const productDetail = async (req, res) => {
  try {
    let search = null
    const { id } = req.params
    const product = await Product.findById(id)
      .populate('category')

    const categoryid = product.category

    const relatedProducts = await Product.find({ category: categoryid, _id: { $ne: id } })
    const selectedVariant = product.variants[0]
    let user = null
    if (req.session.user) {
      user = await User.findOne({ _id: req.session.user })
    }
    res.render('productDetail', {
      user,
      product,
      relatedProducts,
      selectedVariant,
      search
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