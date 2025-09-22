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

const loadEditAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        req.session.addressId = addressId
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

        const userAddressDoc = await Address.findOne({ "addresses._id": addressId }, { "addresses.$": 1 });
        if (!userAddressDoc) return res.status(404).send("Address not found");

        const address = userAddressDoc.addresses[0];
        return res.render('userEditAddress', { search, user, address });
    } catch (error) {
        console.error("Failed to load Edit Address Page : ", error);
        res.status(500).send("Server error");
    }
}

const loadEditAddressCheckOut = async (req, res) => {
    try {
        const addressId = req.params.id;
        req.session.addressId = addressId
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

        const userAddressDoc = await Address.findOne({ "addresses._id": addressId }, { "addresses.$": 1 });
        if (!userAddressDoc) return res.status(404).send("Address not found");

        const address = userAddressDoc.addresses[0];

        return res.status(201).json({ address })

    } catch (error) {
        console.error("Failed to load Edit Address Page : ", error);
        res.status(500).send("Server error");
    }
}

const editAddress = async (req, res) => {
    try {

        const { name, mobile, pincode, locality, address, city, state, landmark, altPhone, addressType } = req.body;

        let userId;
        if (req.session.user) {
            userId = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            userId = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }

        const addressId = req.session.addressId;

        const updated = await Address.findOneAndUpdate(
            { userId: userId, "addresses._id": addressId },
            {
                $set: {
                    "addresses.$.name": name,
                    "addresses.$.mobile": mobile,
                    "addresses.$.pincode": pincode,
                    "addresses.$.locality": locality,
                    "addresses.$.address": address,
                    "addresses.$.city": city,
                    "addresses.$.state": state,
                    "addresses.$.landmark": landmark,
                    "addresses.$.altPhone": altPhone,
                    "addresses.$.addressType": addressType,
                },
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        console.log("Address Deleted Successfully")
        return res.status(200).json({ success: true, message: "Address updated successfully", data: updated });

    } catch (error) {
        console.error("Failed to Edit Address ", error);
        return res.status(500).json({ message: "Server error" });
    }
}

const deleteAddress = async (req, res) => {
    try {

        let user;
        if (req.session.user) {
            user = await User.findOne({ _id: req.session.user, isBlocked: false });
        } else if (req.session.userGoogleId) {
            user = await User.findOne({ googleId: req.session.userGoogleId, isBlocked: false });
        }

        const addressId = req.params.id;

        const deleted = await Address.findOneAndUpdate({ userId: user._id }, { $pull: { addresses: { _id: addressId } } }, { new: true })

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Address Not Found" });
        }

        res.status(200).json({ success: true, message: "Address deleted successfully" })

    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

module.exports = {
    loadAddress,
    loadAddAddress,
    addAddress,
    loadEditAddress,
    loadEditAddressCheckOut,
    editAddress,
    deleteAddress
}
