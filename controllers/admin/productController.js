const Product = require('../../models/productSchema');
const Brand = require('../../models/brandSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const { search } = require('../../routes/adminRouter');

const addProduct = async (req, res) => {
    try {

        const categories = await Category.find({ status: "Active" });
        const brands = await Brand.find({ status: "Active" });
        res.render('admin-addProduct', {
            categories,
            brands,
            product: {},
            isEdit: false
        })


    } catch (error) {
        console.error('Error Loading addProduct :', error);
        res.status(500).send('Server Error');
    }
}

const productInfo = async (req, res) => {
    try {
        const search = req.query.search || '';
        const currentPage = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; // Default limit

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' }; 
        }

        const totalItems = await Category.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limit);

        const products = await Product.find()
            .skip((currentPage - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('brand')
            .populate('category')
            .exec();

        res.render('admin-product', { products, search, limit, currentPage, totalPages });
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

const productDelete = async (req, res) => {
    try {
        const { id } = req.params
        const deleteProduct = await Product.findOneAndDelete({ _id: id })
        if (!deleteProduct) {
            return res.status(404).json({ success: false, message: "Product Not Found" })
        }
        res.status(200).json({ success: true, message: "Product Deleted Successfully" })
    } catch (error) {
        console.error("Error deleting product", error)
        res.status(500).json({ success: false, message: "Server error while deleting product" })
    }
}

const editProduct = async (req, res) => {
    try {
        const { id } = req.params
        const product = await Product.findById(id)
            .populate('brand')
            .populate('category')
            .exec();
        const categories = await Category.find({ status: "Active" });
        const brands = await Brand.find({ status: "Active" });

        if (!product) {
            res.status(404).send("Product Not Found")
        }

        res.render('admin-addProduct', {
            product,
            categories,
            brands,
            isEdit: true
        })
    } catch (error) {
        console.error('Error Loading Product : ', error);
        res.status(500).send('Server Error');
    }
}

const productEditPut = async (req, res) => {
    try {
        const { id } = req.params;
        const { productName, brandName, description, categories, productOffer, variants, productStatus } = req.body
        const variant = JSON.parse(variants)
        console.log("This from req.body  :  ", req.body)
        console.log("This from variant  :  ", variant)

        const variantImage = {}
        req.files.forEach(file => {
            const match = file.fieldname.match(/variants\[(\d+)\]\[images\]/)
            if (match) {
                const index = match[1];
                if (!variantImage[index]) {
                    variantImage[index] = []
                }
                variantImage[index].push(file.filename)
            }
        })

        const existingProduct = await Product.findById(id)
        if (!existingProduct) {
            res.status(404).json({ success: false, message: "Product Not Found" })
        }

        const finalVariants = variant.map((vari, index) => {
            const existingImages = existingProduct.variants[index] ? existingProduct.variants[index].images : [];
            const mergedImages = [...existingImages, ...(variantImage[index] || [])];
            return {
                ...vari,
                images: mergedImages
            };
        });

        console.log("This is items from finalVariant  :  ", finalVariants)

        const updateProduct = await Product.findByIdAndUpdate(id, {
            productName,
            description,
            brand: brandName,
            category: categories,
            productOffer,
            status: productStatus,
            variants: finalVariants
        }, { new: true })

        if (!updateProduct) {
            return res.status(404).json({ success: false, message: 'Product Not Found' });
        }

        console.log("Product Updated successfully");
        res.status(200).json({ success: true, message: 'Product updated successfully' });

    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
}

const removeProductImage = async(req,res)=>{
    try {
        const { productId, variantIndex, imageName } = req.body;

        const product = await Product.findById(productId);
        if (!product || !product.variants[variantIndex]) {
            return res.status(404).json({ success: false, message: 'Product or variant not found' });
        }

        const variant = product.variants[variantIndex];
        const imagePathIndex = variant.images.indexOf(imageName);
        if (imagePathIndex === -1) {
            return res.status(404).json({ success: false, message: 'Image not found in variant' });
        }

        // Remove image from DB
        variant.images.splice(imagePathIndex, 1);
        await product.save();

        // Optional: Remove image file from server
        const imagePath = path.join(__dirname, '../public/productimg', imageName);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        return res.json({ success: true, message: 'Image removed successfully' });
    } catch (err) {
        console.error('Error removing product image:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

module.exports = {
    productInfo,
    addProduct,
    addProductpost,
    productDelete,
    productEditPut,
    editProduct,
    removeProductImage
}