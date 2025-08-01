const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const brandController = require('../controllers/admin/brandController')
const productController = require('../controllers/admin/productController')
const { userAuth, adminAuth, upload } = require('../middlewares/auth');

//Login Management
router.get('/login', adminController.loadLogin);
router.post('/login', adminController.login);
router.get('/errorpage', adminController.errorpage);
router.get('/logout', adminController.logout);

router.use(adminAuth)
router.get('/dashboard', adminController.loadDashboard);

//Costomer Management
router.get('/users', customerController.customerInfo);
router.patch('/customers/:userId/toggle-status', customerController.toggleUserStatus);

//Category Management
router.get('/category', categoryController.categoryInfo);
router.post('/category', categoryController.addCategory);
router.put('/category/:id', categoryController.editCategory);
router.delete('/category/:id', categoryController.deleteCategory);


//Brand Management
router.get('/brand', brandController.brandInfo)
router.post('/brand', brandController.addBrand)
router.put('/brand/:id', brandController.editBrand)


//Product Management
router.get('/productInfo', productController.productInfo)
router.get('/addProduct', productController.addProduct)


module.exports = router;