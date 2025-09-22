const User = require('../../models/userSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');

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
        const { addressId } = req.body
        console.log("CheckOUt : ", addressId)

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
                console.log("Hello ", variant)
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

        console.log(typeof totalAmount)

        const deliveryCharge = totalAmount > 1000 ? 0 : 100;

        const platformFee = totalAmount > 5000 ? 0 : 30

        res.render('checkOutPayment', { search, user, cartItems, totalAmount, deliveryCharge, platformFee })
    } catch (error) {
        console.log("Failed to load loadCheckOutPayment Page : ", error);
        res.send(500).json({ success: false, message: "Internal Server Error" })
    }
}


module.exports = {
    loadCheckOutAddress,
    checkoutSelectAddress,
    loadCheckOutPayment
}