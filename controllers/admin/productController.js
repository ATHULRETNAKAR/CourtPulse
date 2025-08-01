const Product = require('../../models/productSchema');
const Brand = require('../../models/brandSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');

const addProduct = async (req, res) => {
    try {

        const categories = await Category.find({ status: "Active" });
        const brands = await Brand.find({ status: "Active" });
        res.render('admin-addProduct', {
            categories,
            brands,
        })


    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('Server Error');
    }
}

const productInfo = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('brand')
            .populate('category')
            .exec();
        res.render('admin-product', { products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}


module.exports = {
    addProduct,
    productInfo,
}