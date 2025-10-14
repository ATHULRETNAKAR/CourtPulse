const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema')


const productPage = async (req, res) => {
  try {
    let user = null
    if (req.session) {
      if (req.session.user) {
        user = await User.findOne({ _id: req.session.user, isBlocked: false });
      } else if (req.session.userGoogleId) {
        user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
      }
    }

    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      brand,
      inStock,
      sort,
      search,
      ratings
    } = req.query;


    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;


    let filter = { status: { $ne: "Discontinued" } };

    if (search && search.trim().length > 0) {
      filter.productName = { $regex: search.trim(), $options: 'i' };
    }

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
    if (inStock) {
      filter['variants.stockStatus'] = 'In Stock';
      filter.status = 'Available'
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
      sortOption.createdAt = -1;
    }

    // Fetch products with pagination
    const products = await Product.aggregate([
      {
        $match: {
          ...filter,
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand"
        }
      },
      { $unwind: "$brand" },
      { $match: { "brand.status": "Active" } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      { $match: { "category.status": "Active" } },
      { $sort: sortOption },
      { $skip: skip },
      { $limit: limitNum }
    ]);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNum);

    if (req.xhr) {
      return res.json({
        products,
        totalProducts
      });
    }

    const categories = await Category.find({ status: 'Active' }).lean();
    const brands = await Brand.find({ status: 'Active' }).lean();

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
    let reviews = null
    let search = null
    const { id } = req.params
    const product = await Product.findById(id).populate('category').populate('brand')

    const categoryid = product.category

    const relatedProducts = await Product.find({ category: categoryid, _id: { $ne: id } })
    const selectedVariant = product.variants[0]

    let user;
    if (req.session.user) {
      user = await User.findOne({ _id: req.session.user, isBlocked: false });
    } else if (req.session.userGoogleId) {
      user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
    }

    res.render('productDetail', {
      user,
      product,
      relatedProducts,
      selectedVariant,
      search,
      reviews
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