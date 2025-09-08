const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');


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

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Account Verification OTP",
            text: `Your one time password is ${otp}`,
            html: `<b>Your OTP is ${otp}</b>`
        })

        return info.accepted.length > 0

    } catch (error) {
        console.error('Error to sending email OTP', error)
        return false
    }
}

const changeEmailOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 999999).toString()

        const emailSent = await sendVerificationEmail(email, otp)

        if (!emailSent) {
            return res.json({ success: false, message: "Email Not Sent" })
        }

        req.session.emailVerificationOtp = otp;
        console.log(`The OTP is : ${otp}`)

        res.json({ success: true, message: "Email Sent Successfully" })

    } catch (error) {
        console.log('Failed to send otp : ', error)
        res.json({ success: false, message: 'Failed to send OTP.' });
    }
}

const changeEmailVerification = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const sentOTP = req.session.emailVerificationOtp

        if (!sentOTP) {
            return res.json({ success: false, message: "No OTP Found" })
        }
        if (sentOTP !== otp) {
            return res.json({ success: false, message: "Invalid OTP" })
        }
        res.json({ success: true, message: "OTP Verified" })
    } catch (error) {
        console.log('OTP Verification failed : ', error)
        res.json({ success: false, message: 'OTP Verification failed' });
    }
}

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

        res.render('userAddress', { search, user });
    } catch (error) {
        console.log('Failed to load the Address Page : ', error)
    }
}



module.exports = {
    loadProfile,
    updateProfile,
    updateProfileImg,
    changeEmailOTP,
    changeEmailVerification,
    loadAddress
}