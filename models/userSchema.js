const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    name : {
        type:String,
        require:true
    },
    email : {
        type:String,
        require:true,
        unique:true
    },
    phone : {
        type:String,
        require:false,
        unique:false,
        sparse:true,
        default:null
    },
    googleId : {
        type:String,
        unique:true
    },
    password : {
        type:String,
        require:false
    },
    isBlock : {
        type:Boolean,
        default:false
    },
    isAdmin : {
        type:Boolean,
        default:false
    },
    cart : [{
        type:Schema.Types.ObjectId,
        ref:"Cart",
    }],
    wallet : {
        type:Number,
        default:0
    },
    wishlist : [{
        type:Schema.Types.ObjectId,
        ref:"Wishlist"
    }],
    orderHistory : [{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    CreatedOn : {
        type:Date,
        default:Date.now
    },
    referalCode : {
        type:String
    },
    redeemed : {
        type:Boolean
    },
    redeemedUsers : [{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    searchHistory : [{
        category:{
            type:Schema.Types.ObjectId,
            ref:"Category"
        },
        brand : {
            type:String
        },
        searchOn : {
            type:Date,
            default:Date.now
        }
    }]
});

const User = mongoose.model('User',userSchema);

module.exports = User;