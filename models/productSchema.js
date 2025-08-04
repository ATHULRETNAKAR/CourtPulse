const mongoose = require('mongoose');
const { Schema } = mongoose;

const variantSchema = new Schema({
    size: {
        type: String,
        enum: ['N/A','5', '6', '7', '8', '9', '10', '11', '12', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
        required: false
    },
    color: {
        type: String,
        required: true
    },
    stockStatus: {
        type: String,
        enum: ['In Stock', 'Out of Stock'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    originalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: true,
        default: 0
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    images: {
        type: [String],
        required: true
    }
});

const productSchema = new Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: "Brand",
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    productOffer: {
        type: Number,
        default: 0
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Available", "Out of Stock", "Discontinued"],
        required: true,
        default: "Available"
    },
    variants: {
        type: [variantSchema],
        required: true
    }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;