const mongoose = require('mongoose');
const {Schema} = mongoose;

const brandSchema = new Schema({
    brandName : {
        type:String,
        unique:true,
        required:true
    },
    brandImage : {
        type:[String],
        required:true
    },
    status : {
        type: String,
        enum: ['Active', 'Blocked'],
        default: 'Active'
    },
    discount : {
        type:Number,
        default:0
    },
    createdAt : {
        type:Date,
        default:Date.now
    }
})

const Brand = mongoose.model("Brand",brandSchema)

module.exports = Brand