const mongoose = require('mongoose');
const {Schema} = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: { 
        type: String 
    },
    status: {
        type: String,
        enum: ['Active', 'Blocked'],
        default: 'Active'
    },
    discounts : {
        type: Number,
        default:0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Category = mongoose.model("Category",categorySchema)

module.exports = Category