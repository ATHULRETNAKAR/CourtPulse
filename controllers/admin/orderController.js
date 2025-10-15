const Orders = require('../../models/orderSchema');
const orderInfo = async (req, res) => {
    try {
        const { search, sort, filter, page = 1 } = req.query;
        const limit = 5;
        const skip = (parseInt(page) - 1) * limit;
        let query = {};
        if (filter) {
            query.status = filter;
        }
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'userId.name': { $regex: search, $options: 'i' } }
            ];
        }
        let sortObj = { createdOn: -1 };
        if (sort === 'oldest') {
            sortObj = { createdOn: 1 };
        } else if (sort === 'a-z') {
            sortObj = { 'userId.name': 1 };
        } else if (sort === 'z-a') {
            sortObj = { 'userId.name': -1 }
        }
        const orders = await Orders.find(query)
            .populate('orderedItems.product')
            .populate('userId')
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await Orders.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
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
        res.render('admin-orderManagement', {
            orders: formattedOrders,
            search: search || '',
            sort: sort || 'latest',
            filter: filter || '',
            page: parseInt(page),
            totalPages,
            limit
        });
    } catch (error) {
        console.error('Failed in OrderInfo : ', error);
        return res.status(500).send("Internal Server Error");
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
        res.render('admin-orderDetails', { order });
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
        if (updateStatus && updateStatus.orderedItems.every(item => item.status === status)) {
            updateStatus.status = status;
            await updateStatus.save();
        }
        if (updateStatus) {
            await updateStatus.save();
            res.status(200).json({ success: true, message: "Status Updated Successfully" });
        }
    } catch (error) {
        console.log('Failed to updateStatus Admin', error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
const returnDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Orders.findOne({ userId: req.session.userId, orderId: req.session.orderId, 'orderedItems._id': id }, { 'orderedItems.$': 1 });
        res.status(200).json({ returnTitle: order.orderedItems[0].returnTitle, returnReason: order.orderedItems[0].returnReason });
    } catch (error) {
        console.error('Failed returnDetails : ', error)
    }
}
const updateReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Orders.findOne({ userId: req.session.userId, orderId: req.session.orderId, 'orderedItems._id': id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order Not Found' })
        }
        const updateReturn = await Orders.findOneAndUpdate({ userId: req.session.userId, orderId: req.session.orderId, 'orderedItems._id': id },
            { $set: { 'orderedItems.$.status': 'Returned' } },
            { new: true }
        )
        console.log('This is first : ', updateReturn)
        if (updateReturn && updateReturn.orderedItems.every(item => item.status === 'Returned')) {
            updateReturn.status = 'Returned'
            console.log('This is Second : ', updateReturn)
            await updateReturn.save();
        }
        await updateReturn.save();
        res.status(200).json({ success: true, message: 'Return Approved Successfully' })
    } catch (error) {
        console.log('Failed updateReturn ', error)
        res.status(500).send('Internal Server Error');
    }
}
module.exports = {
    orderInfo,
    orderDetail,
    updateStatus,
    returnDetails,
    updateReturn
}