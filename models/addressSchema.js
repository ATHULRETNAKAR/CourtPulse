const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    addresses: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        mobile: {
            type: String,
            required: true,
            trim: true
        },
        pincode: {
            type: String,
            required: true
        },
        locality: {
            type: String,
            required: true
        },
        address: {
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
            type: String,
            required: false
        },
        addressType: {
            type: String,
            enum: ["home", "work"],
            required: true
        }
    }]
}, { timestamps: true });


const Address = mongoose.model("Address", addressSchema)

module.exports = Address