const User = require('../models/userSchema');

const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    next()
                } else {
                    res.redirect('/login')
                }
            })
            .catch(error => {
                console.log('Error in userAuth Middleware', error);
                res.status(500).send('Internal Server Error')
            })
    } else {
        res.redirect('/login')
    }
};

const adminAuth = (req, res, next) => {
    User.findOne({ isAdmin: true })
        .then(data => {
            if (data) {
                next()
            } else {
                res.redirect('/admin/login')
            }
        })
        .catch(error => {
            console.log('Error in adminAuth Middleware', error);
            res.status(500).send('Internal Server Error')
        })
}

const preventCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
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