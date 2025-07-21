const User = require('../../models/userSchema')

const signup = async(req,res)=>{
    const {name,email,phone,password} = req.body;
    try {
        const newUser =  new User({name,email,phone,password})
        console.log(newUser)
        await newUser.save()
        return res.redirect('/signup')
    } catch (error) {
        console.error("Error to save new user",error)
        res.status(500).send("Internal Server Error")
    }
}

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

module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    loadLogin,
    signup,
}