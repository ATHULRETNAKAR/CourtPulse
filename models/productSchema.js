const mongoose = require('mongoose');
const {Schema} = mongoose;

const productSchema = new Schema({
    productName : {
        type:String,
        require:true
    },
    description : {
        type:String,
        require:true
    },
    brand : {
        type:String,
        require:true,
    },
    category : {
        type:Schema.Types.ObjectId,
        ref:"Category",
        require:true
    },
    regularPrice : {
        type:Number,
        require:true
    },
    salePrice : {
        type:Number,
        require:true
    },
    productOffer : {
        type:Number,
        default:0
    },
    quantity : {
        type:Number,
        default:true
    },
    color : {
        type:String,
        require:true
    },
    productImage : {
        type:[String],
        require:true
    },
    isBlocked : {
        type:Boolean,
        default:false
    },
    status : {
        type:String,
        enum:["Available","Out of stoke","Discontinued"],
        require:true,
        default:"Available"
    }
},{timestamps:true})

const Product = mongoose.model("Product",productSchema)

module.exports = Product