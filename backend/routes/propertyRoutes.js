const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect, restrictTo } = require('../middleware/auth');
const Property = require('../models/Property');
const Rating = require('../models/Rating');
const { getPropertyById, addComment, getComments, addReply } = require('../controllers/propertyController');

// Public routes
router.get('/approved', propertyController.getApprovedProperties);

// Protected routes
router.post('/', protect, restrictTo('owner', 'admin'), propertyController.createProperty);

// Route để lấy danh sách tin đăng của chủ trọ
router.get('/my-properties', protect, restrictTo('owner'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { owner: req.user._id };
        
        // Log để debug
        console.log('User ID:', req.user._id);
        console.log('Query:', query);
        
        const properties = await Property.find(query)
            .populate('owner', 'name phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Property.countDocuments(query);

        res.json({
            success: true,
            data: properties,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get my properties error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải danh sách tin đăng'
        });
    }
});

// Route để lấy chi tiết một tin đăng để edit
router.get('/my-properties/:id', protect, restrictTo('owner'), async (req, res) => {
    try {
        // Tìm tin đăng và populate thông tin owner
        const property = await Property.findOne({
            _id: req.params.id,
            owner: req.user._id
        }).populate('owner', 'name phone');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tin đăng hoặc bạn không có quyền truy cập'
            });
        }

        // Log để debug
        console.log('Found property:', property);

        res.json({
            success: true,
            data: {
                _id: property._id,
                name: property.name,
                address: property.address,
                district: property.district,
                description: property.description,
                facilities: {
                    numBedrooms: property.facilities.numBedrooms,
                    bathroom: {
                        hasPrivateToilet: property.facilities.bathroom.hasPrivateToilet
                    },
                    amenities: property.facilities.amenities || [],
                    vehicles: property.facilities.vehicles || []
                },
                images: property.images || [],
                status: property.status,
                owner: {
                    name: property.owner.name,
                    phone: property.owner.phone
                }
            }
        });
    } catch (error) {
        console.error('Get property error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy thông tin tin đăng'
        });
    }
});

// Route để cập nhật tin đăng
router.put('/:id', protect, restrictTo('owner'), async (req, res) => {
    try {
        const property = await Property.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tin đăng hoặc bạn không có quyền chỉnh sửa'
            });
        }

        // Reset status về pending (lowercase)
        req.body.status = 'pending';
        
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedProperty,
            message: 'Cập nhật tin đăng thành công'
        });
    } catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi cập nhật tin đăng'
        });
    }
});

// Route to create a new property
router.post('/properties', protect, restrictTo('owner', 'admin'), async (req, res) => {
    try {
        const propertyData = req.body;
        const newProperty = new Property(propertyData);
        await newProperty.save();

        // Save rating to the ratings collection
        const ratingData = {
            propertyId: newProperty._id,
            rating: propertyData.rating,
            userId: req.user.id
        };
        const newRating = new Rating(ratingData);
        await newRating.save();

        res.status(201).json({ success: true, property: newProperty });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Route to get comments for a property
router.get('/:id/comments', getComments);

// Route to add a comment to a property
router.post('/:id/comments', protect, addComment);

// Route to add a reply to a comment
router.post('/:id/comments/:commentId/replies', protect, addReply);

// Các routes khác
router.delete('/:id', protect, restrictTo('owner', 'admin'), propertyController.deleteProperty);
router.get('/:id', propertyController.getPropertyDetail);

module.exports = router;