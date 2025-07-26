const User = require('../../models/userSchema')

const customerInfo = async (req, res) => {
    try {
        let search = '';
        if (req.query.search) {
            search = req.query.search;
        }

        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page) || 1;
        }

        let limit = 5;
        if (req.query.limit) {
            limit = parseInt(req.query.limit) || 5;
        }

        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: 'i' } },
                { email: { $regex: ".*" + search + ".*", $options: 'i' } },
                { phone: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        }).limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: 'i' } },
                { email: { $regex: ".*" + search + ".*", $options: 'i' } }
            ]
        }).countDocuments();

        const totalPages = Math.ceil(count / limit);

        res.render('admin-customers', {
            data: userData,
            currentPage: page,
            totalPages: totalPages,
            limit: limit,
            search: search
        })

    } catch (error) {
        console.error("Error fetching customer info:", error);
        res.status(500).redirect('/errorpage');
    }
}

const toggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.userId
        const { action } = req.body

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." })
        }

        user.isBlocked = action === "block"
        await user.save()

        res.json({
            success: true,
            newStatus: user.isBlocked ? "Blocked" : "Active",
            message: `User ${user.name} has been ${action}ed.`,
        })
    } catch (error) {
        console.error("Error toggling user status:", error)
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

module.exports = {
    customerInfo,
    toggleUserStatus,
}