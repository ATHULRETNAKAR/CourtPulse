const Product = require('../../models/productSchema');
const Brand = require('../../models/brandSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const mongoose = require('mongoose')

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

const addProductpost = async (req, res) => {
    try {

        const { productName, brandName, description, category, productOffer, productStatus, variants } = req.body;
        const variant = JSON.parse(variants)

        const variantImages = {}

        req.files.forEach(file => {
            const match = file.fieldname.match(/variants\[(\d+)\]\[images\]/)

            if (match) {
                const index = match[1]
                if (!variantImages[index]) {
                    variantImages[index] = []
                }
                variantImages[index].push(file.filename)
            }
        });

        const finalVariants = variant.map((vari, index) => ({
            ...vari,
            images: variantImages[index] || []
        }));
        // console.log("This are the items in finalVarient : ", finalVariants)
        const product = new Product({
            productName,
            description,
            brand: brandName,
            category,
            productOffer,
            productStatus,
            variants: finalVariants
        })

        // console.log("This are the items in the product : ", product)

        await product.save();
        console.log("Product Saved successfully")
        res.status(200).json({ success: true, message: 'Product added successfully' });

    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ success: false, message: 'Error adding product' })
    }
}

module.exports = {
    addProduct,
    productInfo,
    addProductpost,
}