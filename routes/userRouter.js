const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController = require('../controllers/user/userController');
const shopController = require('../controllers/user/shopController');
const profileController = require('../controllers/user/profileController');
const addressController = require('../controllers/user/addressController');
const cartController = require('../controllers/user/cartController');
const checkOutController = require('../controllers/user/checkOutController');
const orderController = require('../controllers/user/orderController');
const { userAuth, adminAuth, preventCache, islogin, isloginAdmin, checkUserStatus } = require('../middlewares/auth');
const profUploads = require('../helpers/Prof_multer');


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

router.get('/profile', profileController.loadProfile);
router.post('/updateProfile', profileController.updateProfile);
router.post('/updateProfileImage', profUploads, profileController.updateProfileImg);
router.post('/emailVerification', profileController.changeEmailOTP);
router.post('/emailVerification/verify', profileController.changeEmailVerification);

router.get('/addresses', addressController.loadAddress);
router.get('/addAddress', addressController.loadAddAddress);
router.post('/addAddress', addressController.addAddress);
router.get('/editAddress/:id', addressController.loadEditAddress);
router.put('/editAddress', addressController.editAddress);
router.delete('/deleteAddress/:id', addressController.deleteAddress);

router.get('/orders', orderController.loadOrders);
router.get('/orderDetails/:id', orderController.loadOrderDetails);
router.get('/cancelTitle', orderController.loadCancelTitles);
router.post('/cancelProduct/:id', orderController.cancelProduct);
router.get('/cancelOrderTitle', orderController.loadCancelTitlesProduct);
router.post('/cancelOrder/:id', orderController.cancelOrder);

router.get('/cart', cartController.loadCart);
router.post('/addToCart', cartController.addToCart);
router.post('/updateCart', cartController.updateQuantity);
router.delete('/removeCart', cartController.removeFromCart);

router.get('/checkOutAddress', checkOutController.loadCheckOutAddress);
router.get('/editAddressCheckOut/:id', addressController.loadEditAddressCheckOut);
router.post('/checkoutSelectAddress', checkOutController.checkoutSelectAddress);
router.get('/checkOutPayment', checkOutController.loadCheckOutPayment);
router.post('/confirmOrder', checkOutController.checkOutPayment);
router.get('/orderSuccessPage', checkOutController.loadOrderSuccess);


module.exports = router