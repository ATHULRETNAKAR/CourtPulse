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

        let orders = await Orders.find({ userId: user._id })
            .populate("orderedItems.product")
            .populate("address")
            .sort({ createdOn: -1 });

        res.render('userOrderManagement', { user, search, orders });
    } catch (error) {
        console.error("Failed userOrderManagement : ", error)
        res.status(500).send('Internal Server Error');
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
        req.session.orderedOrderId = id;

        const order = await Orders.findOne({ orderId: id })
            .populate('orderedItems.product')
            .populate('address')

        res.render('userOrderDetail', { user, search, order })

    } catch (error) {
        console.error('Failed userOrderDetail', error);
        res.status(500).send('Internal Server Error');
    }
}

const loadCancelTitles = async (req, res) => {
    try {

        const titles = await Orders.schema.path('orderedItems').schema.path('cancelletionTitle').enumValues;
        return res.status(200).json({ titles });

    } catch (error) {
        console.error("Failed in loadCancelTitles");
    }
}

const cancelProduct = async (req, res) => {
    try {
        const { id: itemId } = req.params;
        const { selectedTitle: title, additionalReason: reason } = req.body;

        if (!itemId || !title || !reason) {
            return res.status(400).json({ success: false, message: 'Cancellation Reason Not Found' });
        }

        const orderedItem = await Orders.findOne({ orderId: req.session.orderedOrderId, 'orderedItems._id': itemId });

        if (!orderedItem) {
            return res.status(404).json({ success: false, message: "Product Not Found in Order" });
        }

        const updatePrductCancel = await Orders.findOneAndUpdate(
            { orderId: req.session.orderedOrderId, 'orderedItems._id': itemId },
            {
                $set: {
                    'orderedItems.$.status': 'Cancelled',
                    'orderedItems.$.cancelletionTitle': title,
                    'orderedItems.$.cancelletionReason': reason
                }
            },
            { new: true });

        if (updatePrductCancel && updatePrductCancel.orderedItems.every(item => item.status === 'Cancelled')) {
            updatePrductCancel.status = 'Cancelled';
            await updatePrductCancel.save();
            return res.status(200).json({ success: true, message: 'Product Cancelled Successfully' })
        }

        updatePrductCancel.save();
        return res.status(200).json({ success: true, message: 'Product Cancelled Successfully' })

    } catch (error) {
        console.error("Failed to Cancel Product", error);
        res.send(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const loadCancelTitlesProduct = async (req, res) => {
    try {
        const titles = await Orders.schema.path('cancelletionTitle').enumValues;
        return res.status(200).json({ titles });
    } catch (error) {
        console.log("Falied loadCancelTitlesProduct", error);
    }
}

const cancelOrder = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const { selectedTitle: title, additionalReason: reason } = req.body;

        if (!orderId || !title || !reason) {
            return res.status(400).json({ success: false, message: 'Cancellation Reason Not Found' });
        }

        const order = Orders.findById({ _id: orderId });

        if (!order) {
            return res.status(400).json({ success: false, message: 'Order Not Found' });
        }

        const updateOrderCancel = await Orders.findOneAndUpdate({ _id: orderId },
            {
                $set: {
                    status: "Cancelled",
                    cancelletionTitle: title,
                    cancelletionReason: reason,
                    'orderedItems.$[].status': 'Cancelled'
                }
            }, { new: true }
        );

        await updateOrderCancel.save();
        return res.status(200).json({ success: true, message: 'Order Cancelled Successfuly' })

    } catch (error) {
        console.error("Failed to Cancel Product", error);
        res.send(500).json({ success: false, message: 'Internal Server Error' });
    }
}

module.exports = {
    loadOrders,
    loadOrderDetails,
    loadCancelTitles,
    cancelProduct,
    loadCancelTitlesProduct,
    cancelOrder
}