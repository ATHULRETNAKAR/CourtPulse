const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');

router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminController.loadDashboard);
router.get('/pageNotFound',adminController.pageNotFound)








module.exports = router;