const User = require('../../models/userSchema')


const loadProfile = async (req, res) => {
    try {
        let user;
        let search = null;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('userProfile', { search, user });
    } catch (error) {
        console.log("Failed to load profile:", error.message);
        res.status(500).send('Internal Server Error');
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, email, mobile } = req.body;
        let user;

        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }

        if (!user) {
            console.log('UserNot Found To Update Details')
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.name = name || user.name;
        user.phone = mobile || user.mobile;
        if (email && email !== user.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email format' });
            }

            const existingUser = await User.findOne({ email: email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }

            user.email = email;
        }

        await user.save();
        console.log('Profile updated successfully')

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.log("Failed to update profile:", error.message);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

const updateProfileImg = async (req, res) => {
    try {
        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.profileImage = req.file.filename;
        await user.save();

        res.json({ success: true, message: 'Profile image updated successfully' });
    } catch (error) {
        console.log("Failed to update profile image:", error.message);
        res.status(500).json({ success: false, message: 'Failed to update profile image' });
    }
}



module.exports = {
    loadProfile,
    updateProfile,
    updateProfileImg
}