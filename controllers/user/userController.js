const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();

const loadLogin = async(req,res)=>{
    try {
        return res.render('login')
    } catch (error) {
        console.log("Login Page Not Found",error)
        res.status(500).send("Internal Server Errror")
    }
}

const loadSignup = async(req,res)=>{
    try {
        return res.render('signup')
    } catch (error) {
        console.log("Signup Page Not Fount",error)
        res.status(500).send("Internal Server Error")
    }
}

const pageNotFound = async(req,res)=>{
    try {
        return res.status(200).render('page-404')
    } catch (error) {
        console.log("Error Page Not Found",error)
        res.status(500).redirect('/pageNotFound')
    }
}


const loadHomepage = async(req,res)=>{
    try {
        return res.status(200).render('home')
    } catch (error) {
        console.log("Home Page Not Found",error);
        res.status(500).send("Internal Server Error")
    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();
}

async function sendVerificationEmail(email,otp){
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Account Verification OTP",
            text:`Your one time password is ${otp}`,
            html:`<b>Your OTP is ${otp}</b>`
        })

        return info.accepted.length >0

    } catch (error) {
        console.error('Error to sending email OTP',error)
        return false
    }
}

const signup = async(req,res)=>{
    try {
        const {name,phone,email,password,cPassword} = req.body;
        console.log(email,password)

        if(password !== cPassword){
            return res.render('signup',{message:"Password Not Matching"})
        }
        const findUser = await User.findOne({email});

        if(findUser){
            return res.render('signup',{message:"Email Id Already Exist"})
        }
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email,otp)

        if(!emailSent){
            return res.json("Email-Error")
        }
        req.session.userOtp = otp;
        req.session.userData = {name,phone,email,password}

        res.render('verify-otp') 
        console.log("OTP Sent",otp)

    } catch (error) {
        console.error("Signup Error",error)
        res.redirect('/pageNotFound')
    }
}

const securePassword = async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash;
    } catch (error) {
        console.log("Hashing error:", error);
        return null;
    }
}

const verifyOtp = async (req,res)=>{
    try {
        const {otp} = req.body
        if(otp === req.session.userOtp){
            const user = req.session.userData
            const passwordHash = await securePassword(user.password)
            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })
            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({success:true,redirectUrl:"/"})
        }else{
            res.status(400).json({success:false,message:"Invalid OTP ,Please try again"})
        }
    } catch (error) {
        console.error("Error Verifying OTP",error)
        res.status(500).json({success:false,message:"An error occured"})
    }
}

const resendOtp = async (req,res)=>{
    try {
        const userData = req.session.userData;
        const {email} = userData;

        if(!email){
            return res.status(400).json({success:false,message:"Email Not Found In Session"})
        }

        const otp = generateOtp()
        req.session.userOtp = otp;
        const emailSent = await sendVerificationEmail(email,otp)

        if(emailSent) {
            console.log("OTP Resent:", otp);
            res.status(200).json({ success: true, message: "Successfully Resend OTP" });
        }else{
            res.status(500).json({success: false, message:"Failed To Resend OTP"})
        }


    } catch (error) {
        console.error("Error Resending OTP",error);
        res.status(500).json({success:false,message:"Internal Server Error, Please Try Again"})
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
}