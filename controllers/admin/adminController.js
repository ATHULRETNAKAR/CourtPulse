const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const loadLogin = async (req, res) => {
    try {
        if (req.session.admin) {
            return res.redirect('/admin/dashboard')
        }
        
        const message = req.session.message;
        req.session.message = null;
        res.render('admin-login', { message });
    } catch (error) {
        console.log("Failed to load Admin Home", error)
        res.status(500).send('Internal Server Error')
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password)
        const admin = await User.findOne({ isAdmin: true, email: email })

        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                req.session.admin = true;
                res.redirect('/admin/dashboard')
            } else {
                req.session.message = "Invalid Password"
                return res.redirect('/admin/login')
            }
        } else {
            req.session.message = "No Admin Found"
            return res.redirect('/admin/login');
        }

    } catch (error) {
        console.error('Admin Login Error', error)
        req.session.message = "Admin Login Failed. Please Try Again Later";
        return res.redirect('/admin/pageNotFound')
    }
}

const loadDashboard = async (req,res)=>{
    if(req.session.admin){
        try {
            res.render('admin-dashboard')
        } catch (error) {
            res.redirect('/admin/pageNotFound')
        }
    }
}

const errorpage = async (req, res) => {
    try {
        return res.status(200).render('errorpage')
    } catch (error) {
        console.log("Error Page Not Found", error)
        res.status(500).redirect('/errorpage')
    }
}

const logout = async(req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("Session Destroying Failed",err.message);
                return res.redirect('/admin/errorpage');
            }
            return res.redirect('/admin/login')
        })
    } catch (error) {
        console.log("Logout Error",error);
        res.redirect('/admin/errorpage')
    }
}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    errorpage,
    logout,
}