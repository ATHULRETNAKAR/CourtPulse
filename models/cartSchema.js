const mongoose = require("mongoose");
const {Schema} = mongoose;

const cartSchema = new Schema({
    userId : {
        type:Schema.Types.ObjectId,
        ref:"User",
        require:true
    },
    items : [{
        productId : {
            type:Schema.Types.ObjectId,
            ref:"Product",
            require:true
        },
        quantity : {
            type:Number,
            default:1,
        },
        price : {
            type:Number,
            require:true
        },
        totalPrice : {
            type:Number,
            require:true
        },
        status : {
            type:String,
            default:'Placed'
        },
        cancellationReason : {
            type:String,
            default:'none'
        }
    }]
})

const Cart = mongoose.model("Cart",cartSchema)

module.exports = Cart