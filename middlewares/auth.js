const User = require('../models/userSchema');

const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlock) {
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

const preventCache = (req, res, next)=> {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
}

const islogin = (req,res,next)=>{
    const user = req.session.user
    if(user){
        return res.redirect('/')
    }
    next();
}

module.exports = {
    userAuth,
    adminAuth,
    preventCache,
    islogin
}