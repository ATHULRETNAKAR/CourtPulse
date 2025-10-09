const User = require('../../models/userSchema');
const Orders = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const PDFDocument = require('pdfkit');

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

        const order = await Orders.findOne({ orderId: req.session.orderedOrderId, 'orderedItems._id': itemId })
            .populate('orderedItems.product')
            .populate('orderedItems.variantId');
        if (!order) {
            return res.status(404).json({ success: false, message: "Product Not Found in Order" });
        }

        const orderedItem = order.orderedItems.find(item => item._id.toString() === itemId);
        if (!orderedItem) {
            return res.status(404).json({ success: false, message: 'Ordered Item Not Found' });
        }

        const product = await Product.findOne({ _id: orderedItem.product, 'variants._id': orderedItem.variantId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product Not Found' });
        }

        const variant = product.variants.id(orderedItem.variantId)
        console.log('This is matching vairant : ', variant)

        if (variant) {
            variant.quantity += orderedItem.quantity;
            if (variant.stockStatus === 'Out of Stock') {
                variant.stockStatus = 'In Stock';
            };
            await product.save();
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
            return res.status(404).json({ success: false, message: 'Order Not Found' });
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

const loadReturnTitles = async (req, res) => {
    try {
        const titles = await Orders.schema.path('orderedItems').schema.path('returnTitle').enumValues;
        return res.status(200).json({ titles });
    } catch (error) {
        console.log('Failed to loadReturnTitles : ', error)
    }
}

const returnProduct = async (req, res) => {
    try {
        const { id: itemId } = req.params;

        const { selectedTitle: title, additionalReason: reason } = req.body;

        if (!itemId || !title || !reason) {
            return res.status(400).json({ success: false, message: 'Cancellation Reason Not Found' });
        }

        const order = await Orders.findOne({ orderId: req.session.orderedOrderId })

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order Not Found' });
        }

        const product = order.orderedItems.find(item => item._id.toString() === itemId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product Not Found' })
        }

        product.returnTitle = title;
        product.returnReason = reason;
        product.status = 'Return Request';

        if (order && order.orderedItems.every(item => item.status === 'Return Request')) {
            order.status = 'Return Request'
        }

        await order.save();
        return res.status(200).json({ success: true, message: 'Return Request Submitted ' });

    } catch (error) {
        console.log('Failed to returnProduct : ', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const orderInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Orders.findById({ _id: id })
            .populate('orderedItems.product')
            .populate('orderedItems.variantId');

        if (!order) {
            return res.staus(404).json({ message: 'Order Not Found' })
        };

        const pdfDoc = new PDFDocument({ margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderId}.pdf`);
        pdfDoc.pipe(res);

        pdfDoc.fontSize(22).text("CourtPulse", { align: "center" });
        pdfDoc.moveDown(0.5);
        pdfDoc.fontSize(14).text("Invoice", { align: "center" });
        pdfDoc.moveDown(1);

        pdfDoc.fontSize(10);
        pdfDoc.text(`Invoice ID: ${order.orderId}`);
        pdfDoc.text(`Invoice Date: ${order.invoiceDate.toDateString()}`);
        pdfDoc.text(`Payment Method: ${order.paymentMethod}`);
        pdfDoc.text(`Payment Status: ${order.paymentStatus}`);
        pdfDoc.moveDown();

        pdfDoc.fontSize(12).text("Billing Address", { underline: true });
        const addr = order.address;
        pdfDoc.fontSize(10).text(`${addr.name}`);
        pdfDoc.text(`${addr.addressLine}, ${addr.locality}`);
        pdfDoc.text(`${addr.city}, ${addr.state} - ${addr.pincode}`);
        pdfDoc.text(`Mobile: ${addr.mobile}`);
        pdfDoc.moveDown();

        pdfDoc.fontSize(12).text("Ordered Items", { underline: true });
        pdfDoc.moveDown(0.5);

        order.orderedItems.forEach((item, index) => {
            pdfDoc.fontSize(10).text(
                `${index + 1}. ${item.product?.name || "Product"} (${item.status})`
            );
            pdfDoc.text(`   Quantity: ${item.quantity}`);
            pdfDoc.text(`   Price: ₹${item.price.toFixed(2)}`);
            pdfDoc.moveDown(0.3);
        });

        pdfDoc.moveDown(0.5);
        pdfDoc.fontSize(11).text(`Subtotal: ₹${order.totalPrice.toFixed(2)}`);
        pdfDoc.text(`Platform Fee: ₹${order.platformFee}`);
        pdfDoc.text(`Delivery Charge: ₹${order.deliveryCharge}`);
        pdfDoc.text(`Discount: ₹${order.discount}`);
        pdfDoc.moveDown(0.3);
        pdfDoc.fontSize(13).text(`Final Amount: ₹${order.finalAmount.toFixed(2)}`, {
            align: "right",
            underline: true,
        });

        pdfDoc.moveDown(1);
        pdfDoc.fontSize(10).text("Thank you for shopping with CourtPulse!", {
            align: "center",
        });

        pdfDoc.end();
    } catch (error) {
        console.error(' Failed orderInvoice : ', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    loadOrders,
    loadOrderDetails,
    loadCancelTitles,
    cancelProduct,
    loadCancelTitlesProduct,
    cancelOrder,
    loadReturnTitles,
    returnProduct,
    orderInvoice
}