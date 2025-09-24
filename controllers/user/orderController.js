const User = require('../../models/userSchema')
const Orders = require('../../models/orderSchema')

const loadOrders = async (req, res) => {
    try {
        let user;
        let search = null;
        let orders = [];
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false })
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false })
        }

        if (!user) {
            console.log('User Not Found');
            return res.status(401).render('login');
        }

        res.render('userOrderManagement', { user, search, orders })
    } catch (error) {
        console.error("Failed userOrderManagement : ", error)
    }
}

module.exports = {
    loadOrders
}