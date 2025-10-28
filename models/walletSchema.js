const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    transactions: [
        {
            type: {
                type: String,
                enum: ['credit', 'debit'],
            },
            amount: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet