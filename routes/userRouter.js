const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController = require('../controllers/user/userController');
const shopController = require('../controllers/user/shopController');
const { userAuth, adminAuth, preventCache, islogin, checkUserStatus } = require('../middlewares/auth');


router.get('/pageNotFound', userController.pageNotFound);
router.get('/', checkUserStatus, userController.loadHomepage);
router.get('/login', islogin, preventCache, userController.loadLogin);
router.post('/login', userController.login);
router.get('/signup', islogin, preventCache, userController.loadSignup);
router.post('/signup', userController.signup);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
router.get('/logout', userController.logout);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
router.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) {
            console.error(err);
            return res.redirect('/pageNotFound');
        }
        if (!user) {
            // Custom handling for email conflict
            if (info && info.message === "google_email_conflict") {
                req.session.message = "Email already registered. Use your password to login.";
                return res.redirect('/login');
            }
            // Default failure
            req.session.message = "Google login failed. Please try again.";
            return res.redirect('/signup');
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error(err);
                return res.redirect('/pageNotFound');
            }
            req.session.userGoogleId = user.googleId;
            return res.redirect('/');
        });
    })(req, res, next);
});

router.get('/forgotPassword', userController.loadforgot);
router.post('/forgotPassword', userController.forgot);
router.post('/forgotPswVerify', userController.forgotPswVerify);
router.post('/forgotResendOtp', userController.forgotresendOtp);
router.get('/changePassword', userController.loadChangePsw);
router.post('/changePassword', userController.forgotChangePsw);

router.get('/shop', checkUserStatus, shopController.productPage);
router.get('/productDetail/:id', checkUserStatus, shopController.productDetail);


module.exports = router 