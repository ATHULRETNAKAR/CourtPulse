const User = require('../../models/userSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const loadCheckOutAddress = async (req, res) => {
    try {
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
        let address = await Address.findOne({ userId: user._id });
        let addresses = address ? address.addresses : []
        let cartItems = []
        const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");
        if (cart) {
            cartItems = cart.items.map(item => {
                const product = item.productId;
                const variant = product.variants.id(item.variantId)
                return {
                    product: {
                        _id: product._id,
                        name: product.productName,
                        category: product.category,
                        brand: product.brand
                    },
                    variant: variant ? {
                        _id: variant._id,
                        size: variant.size,
                        color: variant.color,
                        images: variant.images
                    } : {
                        _id: null,
                        size: "N/A",
                        color: "N/A",
                        images: ["/default-placeholder.png"]
                    },
                    price: item.price,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice
                };
            })
        }
        let totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
        let deliveryCharge = totalAmount > 1000 ? 0 : 100;
        let platformFee = totalAmount > 5000 ? 0 : 30;
        return res.render('checkOutAddress', { search, user, addresses, cartItems, deliveryCharge, platformFee, totalAmount })
    } catch (error) {
        console.error("Failed to load the checkOut page : ", error)
        res.send(500).send("CheckOut Page Internal Server Error")
    }
}
const checkoutSelectAddress = async (req, res) => {
    try {
        console.log(req.body)
        const { addressId, discount, deliveryCharge, platformFee } = req.body
        req.session.addressId = addressId;
        req.session.discount = discount;
        req.session.deliveryCharge = deliveryCharge;
        req.session.platformFee = platformFee;
        return res.status(200).json({ success: true, redirectUrl: '/checkOutPayment' })
    } catch (error) {
        console.error("Failed CheckOutAddress ", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
}
const loadCheckOutPayment = async (req, res) => {
    try {
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
        let cartItems = [];
        let cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
        if (cart) {
            cartItems = cart.items.map((item) => {
                let product = item.productId;
                let variant = product.variants.id(item.variantId);
                return {
                    product: {
                        _id: product._id,
                        name: product.productName,
                        category: product.category,
                        brand: product.barnd
                    },
                    variant: variant ? {
                        _id: variant._id,
                        size: variant.size,
                        color: variant.color,
                        images: variant.images
                    } : {
                        _id: null,
                        size: "N/A",
                        color: "N/A",
                        images: "/default-placeholder.png",
                    },
                    price: item.price,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice
                }
            })
        }
        const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const deliveryCharge = totalAmount > 1000 ? 0 : 100;
        const platformFee = totalAmount > 5000 ? 0 : 30
        res.render('checkOutPayment', { search, user, cartItems, totalAmount, deliveryCharge, platformFee })
    } catch (error) {
        console.log("Failed to load loadCheckOutPayment Page : ", error);
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}
const checkOutPayment = async (req, res) => {
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
        const cart = await Cart.findOne({ userId: user._id })
            .populate('items.productId')
            .populate('items.variantId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }
        for (const item of cart.items) {
            const product = await Product.findOne({ _id: item.productId._id });
            if (!product) {
                return res.status(400).json({ success: false, message: "Product not found" });
            }
            const variant = product.variants.id(item.variantId._id);
            if (!variant) {
                return res.status(400).json({ success: false, message: "Variant not found" });
            }
            if (variant.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.productName}, Only ${variant.quantity} Left!`
                });
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
            return res.status(400).json({ success: false, message: "No delivey address found" })
        }
        const addressDoc = await Address.findOne({ userId: user._id, "addresses._id": selectedAddress }, { "addresses.$": 1 })
        if (!addressDoc) {
            return res.status(400).json({ success: false, message: "Address not found" });
        }
        const shippingAddress = addressDoc.addresses[0];
        const { paymentMethod, totalAmount, deliveryCharge, platformFee } = req.body;
        const order = new Order({
            userId: user._id,
            orderedItems,
            totalPrice: totalAmount,
            platformFee: req.session.platformFee,
            deliveryCharge: req.session.deliveryCharge,
            finalAmount: totalAmount + deliveryCharge + platformFee,
            discount: 0,
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
            },
            paymentMethod: paymentMethod.toUpperCase(),
            paymentStatus: paymentMethod.toLowerCase() === 'cod' ? "Pending" : "Paid"
        })
        await order.save();
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
        return res.status(200).json({ success: true, redirectUrl: '/orderSuccessPage' });
    } catch (error) {
        console.error("Failed in checkOutPayment : ", error);
        res.status(500).json({ success: false, message: "Interval Server Error" })
    }
}
const loadOrderSuccess = async (req, res) => {
    try {
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
        res.render('orderComplete', { search, user })
    } catch (error) {
        console.error("Failed in loadOrderSuccess : ", error);
        res.status(500).send('Internal Server Error');
    }
}
const loadPaymentFailed = async (req, res) => {
    try {
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
        res.render('orderFailed', { search, user })
    } catch (error) {
        console.error("Failed in loadOrderSuccess : ", error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports = {
    loadCheckOutAddress,
    checkoutSelectAddress,
    loadCheckOutPayment,
    checkOutPayment,
    loadOrderSuccess,
    loadPaymentFailed
}