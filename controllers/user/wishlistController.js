const User = require('../../models/userSchema');
const Wishlist = require('../../models/wishlistSchema');

const loadWishlist = async (req, res) => {
    try {
        let user = null;
        let search = null;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false })
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false })
        }

        if (!user) {
            console.log('User Not Found');
            return res.status(401).render('login');
        }
        req.session.userId = user._id

        const wishlist = await Wishlist.findOne({ userId: req.session.userId })
            .populate('products.productId');

        let wishlistItems = []
        if (wishlist?.products?.length > 0) {
            wishlistItems = wishlist.products.map(item => {

                const product = item.productId;
                if (!product) return null;
                const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
                console.log(variant)
                if (!variant) return null;

                return {
                    name: product.productName,
                    image: `/productimg/${variant.images[0] || 'placeholder.jpg'}`,
                    price: variant.sellingPrice,
                    id: product.id
                }
            }).filter(Boolean);
        }
        const relatedProducts = [];
        res.render('wishlist', { wishlistItems, relatedProducts, search, user })
    } catch (error) {
        console.error('Failed wishlist : ', error);
        res.status(500).send('Failed to Load Wishlist')
    }
}

const addToWishlist = async (req, res) => {
    try {
        const { productId, variantId } = req.body;
        let wishlist = await Wishlist.findOne({ userId: req.session.userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId: req.session.userId,
                product: [{
                    productId,
                    variantId
                }]
            })
            await wishlist.save();
            return res.status(200).json({ success: true, message: 'Added to Wishlist' })
        }

        const existingItem = wishlist.products.find(item => item.productId.toString() === productId && item.variantId.toString() === variantId);
        if (existingItem) {
            return res.status(200).json({ success: false, message: 'Product already in the wishlist' })
        }

        wishlist.products.push({
            productId,
            variantId
        })
        await wishlist.save();
        res.status(200).json({ success: true, message: 'Added to Wishlist' });
    } catch (error) {
        console.error('Failed to addToWishList : ', error)
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

module.exports = {
    loadWishlist,
    addToWishlist
}