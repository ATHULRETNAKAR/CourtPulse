const addProductpost = async (req, res) => {
    try {
        console.log('Request Body:', req.body); // Log request body for debugging
        console.log('Request Files:', req.files); // Log files for debugging

        const { productName, description, brandName, category, variants } = req.body;

        // Handle case where variants might not be sent as JSON
        let parsedVariants = [];
        try {
            parsedVariants = JSON.parse(variants);
        } catch (e) {
            console.error('Error parsing variants:', e);
            return res.status(400).json({ message: 'Invalid variant data' });
        }

        const files = req.files || [];

        const variantsWithImages = parsedVariants.map((variant, index) => {
            const imageFiles = files.filter(file =>
                file.fieldname.startsWith(`variants[${index}][images]`)
            );
            if (imageFiles.length === 0) {
                console.warn(`No images found for variant ${index}`);
            }
            return {
                size: variant.size,
                color: variant.color,
                stockStatus: variant.stockStatus,
                quantity: parseInt(variant.quantity) || 0,
                originalPrice: parseInt(variant.originalPrice) || 0,
                discount: parseInt(variant.discount) || 0,
                sellingPrice: parseInt(variant.sellingPrice) || 0,
                images: imageFiles.length > 0 ? imageFiles.map(file => file.path) : []
            };
        });

        // Convert brandName to ObjectId if it's an ID string
        const brand = mongoose.Types.ObjectId.isValid(brandName) ? brandName : null;
        if (!brand) {
            return res.status(400).json({ message: 'Invalid brand ID' });
        }

        const product = new Product({
            productName,
            description,
            brand,
            category,
            variants: variantsWithImages
        });

        await product.save();
        res.status(200).json({ message: 'Product added successfully' });
    } catch (error) {
        console.error('Error adding product:', error);
        if (error.message.includes('Only images')) {
            res.status(400).json({ message: error.message });
        } else if (error.name === 'ValidationError') {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Error adding product' });
        }
    }
};