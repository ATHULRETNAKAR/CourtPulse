const User = require('../../models/userSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Wallet = require('../../models/walletSchema');
const Razorpay = require('razorpay');
const env = require('dotenv').config();
const crypto = require('crypto');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})
const createOrder = async (req, res) => {
    try {
        const { totalAmount, deliveryCharge, platformFee } = req.body;
        const finalAmount = totalAmount + deliveryCharge + platformFee
        const options = {
            amount: finalAmount * 100,
            currency: "INR",
            receipt: `recpt_${Date.now()}`
        }
        const order = await razorpay.orders.create(options)
        res.status(200).json({ success: true, order, key: process.env.RAZORPAY_KEY_ID })
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create Razorpay Order' })
    }
}
const verifyPayment = async (req, res) => {
    try {
        console.log('This is from verifyPayment');
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false })
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false })
        }
        if (!user) {
            console.log('User Not Found');
            return res.status(401).render('login');
        };
        const cart = await Cart.findOne({ userId: user._id })
            .populate('items.productId')
            .populate('items.variantId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" })
        }
        for (const item of cart.items) {
            const product = await Product.findOne({ _id: item.productId._id });
            if (!product) {
                return res.status(400).json({ success: false, message: "Product not found" })
            }
            const variant = product.variants.id(item.variantId._id);
            if (!variant) {
                return res.status(400).json({ success: false, message: "Variant not found" })
            }
            if (variant.quantity < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficent stoke for ${product.productName}, Only ${variant.quantity} Left!` });
            }
        }
        const orderedItems = cart.items.map((item) => ({
            product: item.productId._id,
            variantId: item.variantId._id,
            quantity: item.quantity,
            price: item.totalPrice
        }));
        const selectedAddress = req.session.addressId;
        if (!selectedAddress) {
            return res.status(400).json({ success: false, message: "No delivery address found" })
        }
        const addressDoc = await Address.findOne({ userId: user._id, "addresses._id": selectedAddress }, { "addresses.$": 1 })
        if (!addressDoc) {
            return res.status(400).json({ success: false, message: "Address not found" });
        }
        const shippingAddress = addressDoc.addresses[0];
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest('hex')
        if (expectedSign === razorpay_signature) {
            await Order.create({
                userId: user._id,
                orderedItems,
                totalPrice: orderData.totalAmount,
                platformFee: orderData.platformFee,
                deliveryCharge: orderData.deliveryCharge,
                finalAmount: orderData.totalAmount + orderData.deliveryCharge + orderData.platformFee,
                discount: 0,
                paymentMethod: "RAZORPAY",
                paymentStatus: "Paid",
                status: "Processing",
                address: {
                    name: shippingAddress.name,
                    mobile: shippingAddress.mobile,
                    pincode: shippingAddress.pincode,
                    locality: shippingAddress.locality,
                    addressLine: shippingAddress.address,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    landmark: shippingAddress.landmark,
                    altPhone: shippingAddress.altPhone,
                    addressType: shippingAddress.addressType
                }
            })
            for (const item of orderedItems) {
                const product = await Product.findOne({ _id: item.product });
                if (product) {
                    const variant = product.variants.id(item.variantId);
                    if (variant) {
                        variant.quantity -= item.quantity;
                        if (variant.quantity <= 0) {
                            variant.quantity = 0;
                            variant.stockStatus = "Out of Stock";
                        }
                        await product.save();
                    }
                }
            }
            await Cart.findOneAndUpdate({ userId: user._id }, { $set: { items: [] } });
            res.json({ success: true, redirectUrl: '/orderSuccessPage' })
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error('error');
        res.status(500).json({ success: false, message: 'Payment verification Failed ' })
    }
}
const failedPayment = async (req, res) => {
    try {
        console.log('This is from filedPayment');
        let user;
        let search = null
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false })
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false })
        }
        if (!user) {
            console.log('User Not Found');
            return res.status(401).render('login');
        }
        const { orderData } = req.body
        const cart = await Cart.findOne({ userId: user._id })
            .populate('items.productId')
            .populate('items.variantId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' })
        }
        const orderedItems = cart.items.map((item) => ({
            product: item.productId._id,
            variantId: item.variantId._id,
            quantity: item.quantity,
            price: item.totalPrice
        }));
        const selectedAddress = req.session.addressId;
        const addressDoc = await Address.findOne({ userId: user._id, "addresses._id": selectedAddress });
        const shippingAddress = addressDoc.addresses[0];
        await Order.create({
            userId: user._id,
            orderedItems,
            totalPrice: orderData.totalAmount,
            platformFee: orderData.platformFee,
            deliveryCharge: orderData.deliveryCharge,
            finalAmount: orderData.totalAmount + orderData.deliveryCharge + orderData.platformFee,
            discount: 0,
            paymentMethod: "RAZORPAY",
            paymentStatus: "Failed",
            status: "Pending",
            address: {
                name: shippingAddress.name,
                mobile: shippingAddress.mobile,
                pincode: shippingAddress.pincode,
                locality: shippingAddress.locality,
                addressLine: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                landmark: shippingAddress.landmark,
                altPhone: shippingAddress.altPhone,
                addressType: shippingAddress.addressType
            }
        });
        res.json({ success: true, redirectUrl: '/paymentFailedPage' });
    } catch (error) {
        console.error('Failed to record payment failure', error);
        res.status(500).json({ success: false, message: "Internal Server Error " })
    }
}
const walletPayment = async (req, res) => {
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
        };
        const { paymentMethod, totalAmount, deliveryCharge, platformFee } = req.body;
        if (paymentMethod !== 'wallet') {
            return res.status(400).json({ success: false, message: '' })
        }
        const grandTotal = totalAmount + deliveryCharge + platformFee;
        const wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet || wallet.balance < grandTotal) {
            return res.json({ success: false, message: 'Insufficent wallet balance. Please add funds or choose another payment method.' });
        }
        wallet.balance -= grandTotal;
        wallet.transactions.push({
            type: 'debit',
            transactionId: crypto.randomBytes(8).toString('hex'),
            status: 'Completed',
            amount: grandTotal,
            date: new Date()
        });
        await wallet.save();
        const cart = await Cart.findOne({ userId: user._id })
            .populate('items.productId')
            .populate('items.variantId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" })
        }
        for (const item of cart.items) {
            const product = await Product.findOne({ _id: item.productId._id })
            if (!product) {
                return res.status(400).json({ success: false, message: 'Product not found' })
            }
            const variant = product.variants.id(item.variantId._id)
            if (!variant) {
                return res.status(400).json({ success: false, message: 'Variant not found' })
            }
            if (variant.quantity < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficent stoke for ${product.productName}, Only ${variant.quantity} Left!` })
            }
        }
        const orderedItems = cart.items.map((item) => ({
            product: item.productId._id,
            variantId: item.variantId._id,
            quantity: item.quantity,
            price: item.totalPrice
        }));
        const selectedAddress = req.session.addressId;
        if (!selectedAddress) {
            return res.status(400).json({ success: false, message: 'No delivery address found' })
        }
        const addressDoc = await Address.findOne({ userId: user._id });
        if (!addressDoc) {
            return res.status(400).json({ success: false, message: 'Address Not found' });
        }
        const shippingAddress = addressDoc.addresses[0];
        await Order.create({
            userId: user._id,
            orderedItems,
            totalPrice: totalAmount,
            platformFee,
            deliveryCharge,
            finalAmount: totalAmount + deliveryCharge + platformFee,
            discount: 0,
            paymentMethod: 'WALLET',
            paymentStatus: 'Paid',
            status: 'Processing',
            address: {
                name: shippingAddress.name,
                mobile: shippingAddress.mobile,
                pincode: shippingAddress.pincode,
                locality: shippingAddress.locality,
                addressLine: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                landmark: shippingAddress.landmark,
                altPhone: shippingAddress.altPhone,
                addressType: shippingAddress.addressType
            }
        })
        for (const item of orderedItems) {
            const product = await Product.findOne({ _id: item.product })
            if (product) {
                const variant = product.variants.id(item.variantId)
                if (variant) {
                    variant.quantity -= item.quantity;
                    if (variant.quantity <= 0) {
                        variant.quantity = 0;
                        variant.stockStatus = "Out of Stock";
                    }
                    await product.save();
                }
            }
        }
        await Cart.findOneAndUpdate({ userId: user._id }, { $set: { items: [] } });
        res.json({ success: true, amount: grandTotal, redirectUrl: '/orderSuccessPage' })
    } catch (error) {
        console.error('Failed in wallet payment : ', error);
        res.status(500).json({ success: false, message: 'Internal Server Error ' });
    }
}
module.exports = {
    createOrder,
    verifyPayment,
    failedPayment,
    walletPayment
}