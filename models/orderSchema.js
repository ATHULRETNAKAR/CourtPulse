const mongoose = require('mongoose');
const {Schema} = mongoose;
const {v4:uuidv4, stringify} = require('uuid');

const orderSchema = new Schema({
    orderId : {
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    orderedItems : [{
        product:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            require:true
        },
        quantity:{
            type:String,
            require:true
        },
        price:{
            type:Number,
            default:0
        }
    }],
    totalPrice : {
        type:Number,
        require:true
    },
    discount : {
        type:Number,
        default:0
    },
    finalAmount : {
        type:Number,
        require:true
    },
    address : {
        type:Schema.Types.ObjectId,
        ref:"Address",
        require:true
    },
    invoiceDate : {
        type:Date,
    },
    status : {
        type:String,
        require:true,
        enum:['Pending','Processing','Shipped','Delivered','Cancelled','Return Request','Returned']
    },
    createdOn : {
        type:Date,
        default:Date.now,
        require:true
    },
    couponApplied : {
        type:Boolean,
        default:false
    }
})

const Order = mongoose.model("Order",orderSchema)

module.exports = Order