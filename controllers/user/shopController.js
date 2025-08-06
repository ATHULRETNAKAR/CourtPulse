const Product = require('../../models/productSchema');

const raquet = async (req, res) => {
  try {

    const user = req.session.user
    const page = parseInt(req.query.page) || 1; // Get page number from query, default to 1
    const itemsPerPage = 4; // Number of items per page
    const skip = (page - 1) * itemsPerPage; // Calculate how many items to skip
    
    
    const product = await Product.find({ status: 'Available' })
    .skip(skip)
    .limit(itemsPerPage)
    .populate('brand category')

    const totalItems = await Product.countDocuments({ category: "68848b2a2be0b2813a50b3be", status: 'Available' });
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Render the EJS template with paginated data
    res.render('shope', {
      product,
      currentPage: page,
      totalPages,
      user
    });
  } catch (error) {
    console.error('Error fetching racquets:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { raquet };