const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    product: [{
        productId : {
            type: Schema.Types.ObjectId,
            ref: "Product",
            require: true
        },
        addedOn : {
            type:Date,
            default:Date.now
        }
    }]

})

const Wishlist = mongoose.model("Wishlist",wishlistSchema)

module.exports = Wishlist