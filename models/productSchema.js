// const mongoose = require('mongoose');
// const {Schema} = mongoose;

// const productSchema = new Schema({
//     productName : {
//         type:String,
//         required:true
//     },
//     description : {
//         type:String,
//         required:true
//     },
//     brand : {
//         type:String,
//         required:true,
//     },
//     category : {
//         type:Schema.Types.ObjectId,
//         ref:"Category",
//         required:true
//     },
//     regularPrice : {
//         type:Number,
//         required:true
//     },
//     salePrice : {
//         type:Number,
//         required:true
//     },
//     productOffer : {
//         type:Number,
//         default:0
//     },
//     quantity : {
//         type:Number,
//         default:true
//     },
//     color : {
//         type:String,
//         required:true
//     },
//     productImage : {
//         type:[String],
//         required:true
//     },
//     isBlocked : {
//         type:Boolean,
//         default:false
//     },
//     status : {
//         type:String,
//         enum:["Available","Out of stoke","Discontinued"],
//         required:true,
//         default:"Available"
//     }
// },{timestamps:true})

// const Product = mongoose.model("Product",productSchema)

// module.exports = Product





const mongoose = require('mongoose');
const { Schema } = mongoose;

const variantSchema = new Schema({
    size: {
        type: String,
        required: true,
        enum: ['5', '6', '7', '8', '9', '10', '11', '12', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] // Matches dropdown options
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
        ref: "Brand", // Assuming a Brand model exists; adjust if using String
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