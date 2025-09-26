const User = require('../../models/userSchema')
const Orders = require('../../models/orderSchema');

const loadOrders = async (req, res) => {
    try {
        let user;
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

        const ord = await Orders.find({ userId: user._id });
        console.log(ord.map((o)=>o.address))

        let orders = await Orders.find({ userId: user._id })
            .populate("orderedItems.product")
            .populate("address")
            .sort({ createdOn: -1 });

        res.render('userOrderManagement', { user, search, orders });
    } catch (error) {
        console.error("Failed userOrderManagement : ", error)
    }
}

const loadOrderDetails = async (req, res) => {
    try {
        let user;
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

        let { id } = req.params

        const order = await Orders.findOne({ orderId: id })
            .populate('orderedItems.product')
            .populate('address')

        res.render('userOrderDetail', { user, search, order })

    } catch (error) {
        console.error('Failed userOrderDetail', error)
    }
}

module.exports = {
    loadOrders,
    loadOrderDetails
}