const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect, restrictTo } = require('../middleware/auth');

// Public routes
router.get('/approved', propertyController.getApprovedProperties);

// Protected routes
router.post('/', protect, restrictTo('owner', 'admin'), propertyController.createProperty);
router.get('/my-properties', protect, restrictTo('owner', 'admin'), propertyController.getMyProperties);
router.put('/:id', protect, restrictTo('owner', 'admin'), propertyController.updateProperty);
router.delete('/:id', protect, restrictTo('owner', 'admin'), propertyController.deleteProperty);
router.get('/:id', propertyController.getPropertyDetail);

module.exports = router; 