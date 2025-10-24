const User = require('../models/userSchema');

const userAuth = async (req, res, next) => {
    try {
        const userId = req.session.user || req.session.userGoogleId
        if (!userId) {
            return res.redirect('/login');
        }
        const user = await User.find({
            $or: [{ _id: userId }, { googleId: userId }]
        })
        if (user && !user.isBlocked) {
            return next();
        }
        req.session.destroy(() => { 
            res.redirect('/login')
        })
    } catch (error) {
        console.error('Error in userAuth Middleware:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
}

const adminAuth = (req, res, next) => {
    try {
        if (req.session && req.session.admin === true) {
            return next();
        }
        return res.redirect('/admin/login');
    } catch (error) {
        console.log('Error in adminAuth Middleware', error);
        return res.status(500).send('Internal Server Error');
    }
}

const preventCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
}

const islogin = (req, res, next) => {
    const user = req.session.user
    if (user) {
        return res.redirect('/')
    }
    next();
}
const isloginAdmin = (req, res, next) => {
    const user = req.session.user
    if (user) {
        return res.redirect('/')
    }
    next();
}

const checkUserStatus = async (req, res, next) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user);

            if (!user) {
                req.session.destroy();
                return res.redirect('/login');
            }

            if (user.isBlocked) {
                const blockMessage = "Your account has been blocked by admin";
                return req.session.destroy((err) => {
                    if (err) console.log("Session destroy error", err);
                    return res.redirect(`/login?msg=${encodeURIComponent(blockMessage)}`);
                });
            }
        }
        return next();
    } catch (error) {
        console.error("Error checking user status:", error);
        return next(error);
    }
};


module.exports = {
    userAuth,
    adminAuth,
    preventCache,
    islogin,
    isloginAdmin,
    checkUserStatus
}