const mongoose = require('mongoose');
const { Schema } = mongoose;

const bannerSchema = new Schema({
    image: {
        type:String,
        require: true
    },
    title : {
        type:String,
        require:true
    },
    description : {
        type:String,
        require:true
    },
    link : {
        type:String
    },
    startDate : {
        type:Date,
        require:true
    },
    endDate : {
        type:Date,
        require:true
    }
})

const Banner = mongoose.model('Banner',bannerSchema);

module.exports = Banner;