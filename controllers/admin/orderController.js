const Orders = require('../../models/orderSchema');

const orderInfo = async (req, res) => {
    try {
        const orders = await Orders.find()
            .populate('orderedItems.product')
            .populate('userId')
            .sort({ createdOn: -1 })
            .lean();

        const formattedOrders = orders.map(order => {
            const date = new Date(order.createdOn);
            const formattedDate = date.toLocaleString('en-GB', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', '');
            return {
                ...order,
                formattedDate
            }
        })
        const limit = null;
        const search = null;
        return res.render('admin-orderManagement', { orders: formattedOrders, limit, search });
    } catch (error) {
        console.error('Failed in OrderInfo : ', error)
    }
}

const orderDetail = async (req, res) => {
    try {
        const { orderId, userId } = req.params;

        req.session.userId = userId;
        req.session.orderId = orderId;

        const order = await Orders.findOne({ orderId, userId })
            .populate('orderedItems.product')
            .populate('userId')
            .populate('address')
            .lean()

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const date = new Date(order.createdOn);
        const formattedDate = date.toLocaleString('en-GB', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace(',', '');

        order.formattedDate = formattedDate

        return res.render('admin-orderDetails', { order });
    } catch (error) {
        console.log('Failed admin OrderDetail : ', error);
    }
}

const updateStatus = async (req, res) => {
    try {
        const { id, status } = req.body;

        if (!id || !status) {
            return res.status(400).json({ success: false, message: "No Status or Id found" });
        };

        const order = await Orders.findOne({ userId: req.session.userId, orderId: req.session.orderId, 'orderedItems._id': id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const updateStatus = await Orders.findOneAndUpdate({ userId: req.session.userId, orderId: req.session.orderId, 'orderedItems._id': id },
            { $set: { 'orderedItems.$.status': status } },
            { new: true }
        )
        if (updateStatus) {
            return res.status(200).json({ success: true, message: "Status Updated Successfully" });
        }
    } catch (error) {
        console.log('Failed to updateStatus Admin', error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


module.exports = {
    orderInfo,
    orderDetail,
    updateStatus
}