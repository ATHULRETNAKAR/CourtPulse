const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');


const productPage = async (req, res) => {
  try {
    const user = req.session.user;
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 12;
    const skip = (page - 1) * itemsPerPage;

    const {
      category,
      minPrice,
      maxPrice,
      brand,
      availability,
      sort,
    } = req.query;

    console.log(req.body)

    let filter = { status: 'Available' };

    // Category filter (can be single or array)
    if (category) {
      const selectedCategories = Array.isArray(category) ? category : [category];
      filter.category = { $in: selectedCategories };
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter['variants.sellingPrice'] = {};
      if (minPrice) filter['variants.sellingPrice'].$gte = parseInt(minPrice);
      if (maxPrice) filter['variants.sellingPrice'].$lte = parseInt(maxPrice);
    }

    // Brand filter (can be single or array)
    if (brand) {
      const selectedBrands = Array.isArray(brand) ? brand : [brand];
      filter.brand = { $in: selectedBrands };
    }

    // Availability
    if (availability === 'inStock') {
      filter['variants.stockStatus'] = 'Available';
    }

    // Sort
    let sortOption = {};
    if (sort === 'priceLowToHigh') {
      sortOption['variants.sellingPrice'] = 1;
    } else if (sort === 'priceHighToLow') {
      sortOption['variants.sellingPrice'] = -1;
    } else if (sort === 'nameAZ') {
      sortOption.name = 1;
    } else if (sort === 'nameZA') {
      sortOption.name = -1;
    } else {
      sortOption.createdAt = -1;
    }

    // Final query
    const product = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(itemsPerPage)
      .populate('brand category');

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