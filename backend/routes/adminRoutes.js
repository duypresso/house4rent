const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// Middleware kiểm tra quyền admin
router.use(protect, restrictTo('admin'));

// Quản lý bài đăng
router.get('/properties', adminController.getAllProperties);
router.get('/properties/pending', adminController.getPendingProperties);
router.put('/properties/:id/approve', adminController.approveProperty);
router.put('/properties/:id/reject', adminController.rejectProperty);
router.delete('/properties/:id', adminController.deleteProperty);

// Quản lý người dùng
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Thống kê
router.get('/stats', adminController.getStats);

module.exports = router; 