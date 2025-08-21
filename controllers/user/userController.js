const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const Category = require('../../models/categorySchema')

const loadLogin = async (req, res) => {
    try {
        if (!req.session.user || !req.session.userGoogleId) {
            const message = req.session.message || req.query.msg;
            req.session.message = null;
            return res.render('login', { message })
        } else {
            res.redirect('/')
        }
    } catch (error) {
        console.log("Login Page Not Found", error)
        res.redirect('/pageNotFound')
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await User.findOne({ isAdmin: 0, email: email })

        if (findUser.googleId) {
            req.session.message = "User Logged With Google. Login With Google";
            return res.redirect('/login')
        }

        if (!findUser) {
            req.session.message = "User Not Found";
            return res.redirect('/login')
        }

        if (findUser.isBlocked) {
            req.session.message = "This User Is Blocked By Admin";
            return res.redirect('/login')
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if (!passwordMatch) {
            req.session.message = "Incorrect Password";
            return res.redirect('/login')
        }

        req.session.user = findUser._id;
        res.redirect('/')

    } catch (error) {
        console.error('Login Error', error)
        req.session.message = "Login Failed. Please Try Again Later";
        return res.redirect('/login')
    }
}

const loadSignup = async (req, res) => {
    try {
        const message = req.session.message;
        req.session.message = null;
        return res.render('signup', { message })
    } catch (error) {
        console.log("Signup Page Not Fount", error)
        res.status(500).send("Internal Server Error")
    }
}

const pageNotFound = async (req, res) => {
    try {
        return res.status(200).render('page-404')
    } catch (error) {
        console.log("Error Page Not Found", error)
        res.status(500).redirect('/pageNotFound')
    }
}


const loadHomepage = async (req, res) => {
    try {
        console.log('loadHomepage')
        const categories = await Category.find()
        let user = null
        let search = null

        if (req.session) {
            if (req.session.user) {
                user = await User.findOne({ _id: req.session.user });
            } else if (req.session.userGoogleId) {
                user = await User.findOne({ googleId: req.session.userGoogleId });
            }
        }

        return res.status(200).render('home', { user, categories, search })
    } catch (error) {
        console.log("Home Page Not Found", error);
        if (!res.headersSent) {
            res.status(500).send("Internal Server Error");
        }
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

const signup = async (req, res) => {
    try {
        const { name, phone, email, password, cPassword } = req.body;
        console.log(email, password)

        if (password !== cPassword) {
            req.session.message = "Password Not Matching"
            return res.redirect('/signup')
        }
        const findUser = await User.findOne({ email });

        if (findUser) {
            req.session.message = "User With Same Email-Id Already Exist"
            return res.redirect('/signup')
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp)

        if (!emailSent) {
            return res.json("Email-Error")
        }
        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password }

        res.render('verify-otp')
        console.log("OTP Sent", otp)

    } catch (error) {
        console.error("Signup Error", error)
        res.redirect('/pageNotFound')
    }
}

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
        console.log("Hashing error:", error);
        return null;
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body
        if (otp === req.session.userOtp) {
            const user = req.session.userData
            const passwordHash = await securePassword(user.password)
            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash
            })
            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({ success: true, redirectUrl: "/" })
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP ,Please try again" })
        }
    } catch (error) {
        console.error("Error Verifying OTP", error)
        res.status(500).json({ success: false, message: "An error occured" })
    }
}

const resendOtp = async (req, res) => {
    try {
        const userData = req.session.userData;
        const { email } = userData;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email Not Found In Session" })
        }

        const otp = generateOtp()
        req.session.userOtp = otp;
        const emailSent = await sendVerificationEmail(email, otp)

        if (emailSent) {
            console.log("OTP Resent:", otp);
            res.status(200).json({ success: true, message: "Successfully Resend OTP" });
        } else {
            res.status(500).json({ success: false, message: "Failed To Resend OTP" })
        }


    } catch (error) {
        console.error("Error Resending OTP", error);
        res.status(500).json({ success: false, message: "Internal Server Error, Please Try Again" })
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("Session Destroying Failed", err.message);
                return res.redirect('/pageNotFound');
            }
            return res.redirect('/login')
        })
    } catch (error) {
        console.log("Logout Error", error);
        res.redirect('/pageNotFound')
    }
}

const loadforgot = async (req, res) => {
    try {
        const message = req.session.message;
        req.session.message = null;
        return res.render('forgotPswEmail', { message })
    } catch (error) {
        console.log("Forgot Page Not Found", error)
        res.status(500).send("Internal Server Error")
    }
}

const forgot = async (req, res) => {
    try {
        const { email } = req.body
        const existEmail = await User.findOne({ email })
        if (!existEmail) {
            req.session.message = 'Email not exist..! Try again'
            res.redirect('/forgotPassword')
        }
        req.session.userEmail = email
        const otp = await generateOtp();
        const emailSent = await sendVerificationEmail(email, otp)

        if (!emailSent) {
            req.session.message = 'Failed to sent otp'
            res.redirect('/forgotPassword')
        }

        req.session.userOtp = otp;
        res.render('forgotPsw-verify-otp')
        console.log("OTP Sent", otp)

    } catch (error) {
        console.error('Login Error', error)
        req.session.message = "Login Failed. Please Try Again Later";
        return res.redirect('/login')
    }
}

const forgotPswVerify = async (req, res) => {
    try {
        const { otp } = req.body
        if (otp === req.session.userOtp) {
            console.log('OTP Verified')
            res.json({ success: true, redirectUrl: "/changePassword" })
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP ,Please try again" })
        }
    } catch (error) {
        console.error("Error Verifying OTP", error)
        res.status(500).json({ success: false, message: "An error occured" })
    }
}

const forgotresendOtp = async (req, res) => {
    try {

        const email = req.session.userEmail;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email Not Found In Session" })
        }

        const otp = generateOtp()
        req.session.userOtp = otp;
        const emailSent = await sendVerificationEmail(email, otp)

        if (emailSent) {
            console.log("OTP Resent:", otp);
            res.status(200).json({ success: true, message: "Successfully Resend OTP" });
        } else {
            res.status(500).json({ success: false, message: "Failed To Resend OTP" })
        }


    } catch (error) {
        console.error("Error Resending OTP", error);
        res.status(500).json({ success: false, message: "Internal Server Error, Please Try Again" })
    }
}

const loadChangePsw = async (req, res) => {
    try {
        res.render('changePassword')
    } catch (error) {
        console.error("Error on loadChangePsw:", error);
        return res.status(500).send("Something went wrong. Please try again later.");
    }
}

const forgotChangePsw = async (req, res) => {
    try {
        const email = req.session.userEmail
        const { newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Password not matchting" })
        }

        const hashedPassword = await securePassword(confirmPassword)
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.password = hashedPassword;
        await user.save()
        console.log("Password Changed")
        res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        console.log("Error on forgtChangePsw  " + error)
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    loadLogin,
    signup,
    verifyOtp,
    resendOtp,
    login,
    logout,
    loadforgot,
    forgot,
    forgotPswVerify,
    forgotresendOtp,
    loadChangePsw,
    forgotChangePsw
}