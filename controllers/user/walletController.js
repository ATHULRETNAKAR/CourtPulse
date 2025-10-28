const Wallet = require('../../models/walletSchema');
const User = require('../../models/userSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../../models/orderSchema');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

const loadWallet = async (req, res) => {
    try {
        let search = null
        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false })
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false })
        }
        if (!user) {
            console.log('User Not Found');
            return res.status(401).render('login');
        }
        const wallet = await Wallet.findOne({ userId: user._id })
        res.render('wallet', { walletBalance: wallet?.balance || 0, user, search })
    } catch (error) {
        console.error('Error in loadWallet : ', error);
        res.status(500).send('Internal Server Error');
    }
}

const createWalletOrder = async (req, res) => {
    try {
        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false })
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false })
        }
        if (!user) {
            console.log('User Not Found');
            return res.status(401).render('login');
        }
        const { amount } = req.body;
        if (!amount || amount <= 0 || amount >= 10001) {
            return res.status(400).json({ success: false, message: 'Invalid Amount' })
        };
        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: 'wallet_' + new Date().getTime(),
        };
        const order = await razorpay.orders.create(options);
        return res.status(200).json({ success: true, data: order, key: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Failed to create wallet order : ', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const verifyWalletPayment = async (req, res) => {
    try {
        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false })
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false })
        }
        if (!user) {
            console.log('User Not Found');
            return res.status(401).render('login');
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");
        if (expectedSign === razorpay_signature) {
            let wallet = await Wallet.findOne({ userId: user._id });
            if (!wallet) {
                wallet = new Wallet({ userId: user._id, balance: 0, transactions: [] });
            }
            wallet.balance += parseFloat(amount);
            wallet.transactions.push({
                type: 'credit',
                amount,
                date: new Date()
            });
            await wallet.save();
            return res.status(200).json({ success: true, message: 'Wallet updated successfully' });
        } else {
            return res.status(400).json({ success: true, message: "Invalid signature" });
        }
    } catch (error) {
        console.log('Failed to verify payment : ', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    loadWallet,
    createWalletOrder,
    verifyWalletPayment
}