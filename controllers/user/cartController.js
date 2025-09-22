const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');

const loadCart = async (req, res) => {
    try {

        let user;
        let search = null
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }

        if (!user) {
            return res.redirect('/login')
        }

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
        
        let platformFee = totalAmount > 5000 ? 0 : 30

        let similarItems = []
        if (cartItems.length > 0) {
            const categories = cartItems.map(item => item.product.category);
            const brands = cartItems.map(item => item.product.brand);
            const excludeIds = cartItems.map(item => item.product._id);

            similarItems = await Product.find({
                $or: [
                    { category: { $in: categories } },
                    { brand: { $in: brands } }
                ],
                _id: { $nin: excludeIds }
            })
                .limit(4);
        }

        return res.render('cart', { user, search, cartItems, deliveryCharge, similarItems, totalAmount, platformFee })
    } catch (error) {
        console.log("Cart Loading Failed : ", error)
        res.status(500).send('Failed to Load Cart')
    }
};

const addToCart = async (req, res) => {
    try {
        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }

        if (!user) {
            console.log('User Not Found')
            return res.status(404).json({ success: false, message: "User Not Found. Please Login..!" })
        }

        const { productId, variantId } = req.body;
        console.log("Product Id : ", productId)
        console.log("Variant Id : ", variantId)

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product Not Found" })
        }

        const variant = product.variants.id(variantId)
        if (!variant) {
            return res.status(404).json({ success: false, message: "Variant Not Found" })
        }

        let cart = await Cart.findOne({ userId: user._id })

        if (!cart) {
            cart = new Cart({
                userId: user._id,
                items: [{
                    productId: product._id,
                    variantId: variant._id,
                    quantity: 1,
                    price: variant.sellingPrice,
                    totalPrice: variant.sellingPrice
                }]
            })
            await cart.save()
            return res.status(200).json({ success: true, message: "Product added to cart", cart })
        }

        const existingItem = cart.items.find(item => item.productId.toString() === productId && item.variantId.toString() === variantId);

        if (existingItem) {
            return res.status(200).json({ success: false, message: "Product already in the cart" })
        }

        cart.items.push({
            productId: product._id,
            variantId: variant._id,
            quantity: 1,
            price: variant.sellingPrice,
            totalPrice: variant.sellingPrice
        })

        console.log("Product Added to cart")
        await cart.save()
        res.status(200).json({ success: true, message: "Product added to cart", cart })

    } catch (error) {
        console.log('Product Failed to Add Cart : ', error);
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

const updateQuantity = async (req, res) => {
    try {
        const { productId, variantId, action } = req.body

        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }


        const cart = await Cart.findOne({ userId: user._id })
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart Not Found" })
        }


        const item = cart.items.find(i =>
            i.productId.toString() === productId && i.variantId.toString() === variantId
        )
        if (!item) {
            return res.status(404).json({ success: false, message: "Item Not Found" })
        }

        if (action === "increase") {
            if (item.quantity < 4) {
                item.quantity += 1;
            } else {
                return res.json({ success: false, message: "Maximum 4 items allowed" });
            }
        } else if (action === "decrease" && item.quantity > 1) {
            item.quantity -= 1
        }

        item.totalPrice = item.quantity * item.price;
        await cart.save()

        return res.status(200).json({ success: true, item, totalAmount: cart.items.reduce((sum, i) => sum + i.totalPrice, 0) })

    } catch (error) {
        console.error("Update Quantity Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

const removeFromCart = async (req, res) => {
    try {

        const { productId, variantId } = req.body

        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        if (!productId || !variantId) {
            return res.status(400).json({ success: false, message: "Product and variant required" });
        }

        const cart = await Cart.findOne({ userId: user._id })
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart Not Found" })
        }

        const itemIndex = cart.items.findIndex(
            (item) =>
                item.productId.toString() === productId &&
                item.variantId.toString() === variantId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        cart.items.splice(itemIndex, 1);

        let newCartTotal = 0;
        cart.items.forEach(item => {
            newCartTotal += item.totalPrice;
        });

        await cart.save();

        return res.json({
            success: true,
            message: "Item removed from cart",
            newCartTotal,
            remainingItems: cart.items.length
        });

    } catch (error) {
        console.error("Error removing item:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

module.exports = {
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart
};
