const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');

const loadAddress = async (req, res) => {
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

        const addressDoc = await Address.findOne({ userId: user._id });
        const addresses = addressDoc ? addressDoc.addresses : [];

        res.render('userAddress', { search, user, addresses });
    } catch (error) {
        console.log('Failed to load the Address Page : ', error)
    }
}

const loadAddAddress = async (req, res) => {
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

        res.render('userAddAddress', { search, user });
    } catch (error) {
        console.log('addAddress failed to load : ', error)
    }
}

const addAddress = async (req, res) => {
    try {
        const { name, mobile, pincode, locality, address, city, state, landmark, alternate, addressType } = req.body

        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not logged in' });
        }

        if (!name || !mobile || !pincode || !locality || !address || !city || !state || !addressType) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be 10 digits' });
        }

        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ message: 'Pincode must be 6 digits' });
        }

        if (!['home', 'work'].includes(addressType)) {
            return res.status(400).json({ message: 'Address type must be either "home" or "work"' });
        }

        const newAddress = {
            name,
            mobile,
            pincode,
            locality,
            address,
            city,
            state,
            landmark: landmark || '',
            altPhone: alternate || '',
            addressType
        };

        if (user) {
            const updatedAddress = await Address.findOneAndUpdate(
                { userId: user._id },
                { $push: { addresses: newAddress } },
                { new: true, upsert: true }
            );

            if (updatedAddress) {
                console.log("Address Added successfully");
                return res.status(201).json({ message: "Address added successfully" });
            }
        }

    } catch (error) {
        console.error("Failed to add Address ", error);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    loadAddress,
    loadAddAddress,
    addAddress
}
