const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const {userAuth,adminAuth} = require('../middlewares/auth');

//Login Management
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.get('/errorpage',adminController.errorpage);
router.get('/logout',adminController.logout);


//Costomer Management
router.get('/users',adminAuth,customerController.customerInfo);
router.patch('/customers/:userId/toggle-status',adminAuth,customerController.toggleUserStatus);

//Category Management
router.get('/category',adminAuth,categoryController.categoryInfo);
router.post('/category',adminAuth, categoryController.addCategory);
router.put('/category/:id',adminAuth, categoryController.editCategory);
router.delete('/category/:id',adminAuth, categoryController.deleteCategory);



module.exports = router;