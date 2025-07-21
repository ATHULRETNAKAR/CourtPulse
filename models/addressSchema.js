const mongoose = require('mongoose');
const {Schema} = mongoose;

const addressSchema = new Schema({
    userId : {
        type:Schema.Types.ObjectId,
        ref:"User",
        require:true
    },
    address : [{
        addressType : {
            type:String,
            require:true
        }

    }],
    name : {
        type:String,
        require:true
    }, 
    city : {
        type:String,
        require:true
    },
    landMark : {
        type:String,
        require:true
    },
    state : {
        type:String,
        require:true
    },
    pincode : {
        type:Number,
        require:true
    },
    phone : {
        type:String,
        require:true
    },
    altPhone : {
        type:String,
        require:true
    }
})

const Address = mongoose.model("Address",addressSchema)

module.exports = Address