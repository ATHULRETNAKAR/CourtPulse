const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderedItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            default: 0
        },
        cancelletionTitle: {
            type: String,
            enum: ["Changed mind", "Found better choice", "Wrong size selected", "Wrong color selected", "Product not needed anymore", "Ordered by mistake", "Found cheaper elsewhere", "Delivery taking too long", "Duplicate order placed", "Others"]
        },
        cancelletionReason: {
            type: String,
            required: false
        },
        returnTitle: {
            type: String,
            enum: ["Item damaged", "Defective product received", "Wrong item delivered", "Missing parts/accessories", "Size issue", "Color mismatch", "Quality issue", "Product not as described", "Expired product received", "Not expected", "No longer needed", "Ordered by mistake", "Gift not suitable", "Others"]
        },
        returnReason: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Returned'],
            default: 'Pending'
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    platformFee: {
        type: Number,
        default: 0
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
        name: {
            type: String,
            required: true
        },
        mobile: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        },
        locality: {
            type: String,
            required: true
        },
        addressLine: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        landmark: {
            type: String,
            default: ""
        },
        altPhone: {
            type: String
        },
        addressType: {
            type: String,
            enum: ["home", "work"], required: true
        }
    },
    paymentMethod: {
        type: String,
        enum: ["RAZORPAY", "COD", "CARD", "UPI", "WALLET"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending"
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Returned'],
        default: 'Pending'
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    cancelletionTitle: {
        type: String,
        enum: ["Changed mind", "Found better choice", "Product not needed anymore", "Ordered by mistake", "Found cheaper elsewhere", "Delivery taking too long", "Duplicate order placed", "Others"]
    },
    cancelletionReason: {
        type: String,
        required: false
    },
    returnTitle: {
        type: String,
        enum: ["Item damaged", "Defective product received", "Wrong item delivered", "Missing parts/accessories", "Size issue", "Color mismatch", "Quality issue", "Product not as described", "Expired product received", "Not expected", "No longer needed", "Ordered by mistake", "Gift not suitable", "Others"]
    },
    returnReason: {
        type: String,
        required: false,
    },
    couponApplied: {
        type: Boolean,
        default: false
    }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
