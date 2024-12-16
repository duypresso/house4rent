const Property = require('../models/Property');

exports.getApprovedProperties = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        
        // Xây dựng query
        let query = { status: 'approved' };
        
        // Thêm điều kiện tìm kiếm nếu có
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Thực hiện query với phân trang
        const properties = await Property.find(query)
            .populate('owner', 'name phone')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Đếm tổng số bài đăng
        const total = await Property.countDocuments(query);

        res.json({
            success: true,
            data: properties,
            pagination: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get approved properties error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bài đăng',
            error: error.message
        });
    }
};

exports.createProperty = async (req, res) => {
    try {
        // Tạo property mới
        const propertyData = {
            ...req.body,
            owner: req.user._id,
            status: 'pending'
        };

        const property = new Property(propertyData);
        await property.save();

        res.status(201).json({
            success: true,
            message: 'Đăng tin thành công, đang chờ phê duyệt',
            data: property
        });
    } catch (error) {
        console.error('Create property error:', error);
        res.status(400).json({
            success: false,
            message: 'Có lỗi xảy ra khi đăng tin',
            error: error.message
        });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const property = await Property.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tin đăng'
            });
        }

        // Cập nhật thông tin
        const updateData = {
            ...req.body,
            status: 'pending' // Reset status khi cập nhật
        };

        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Cập nhật thành công, đang chờ phê duyệt',
            data: updatedProperty
        });
    } catch (error) {
        console.error('Update property error:', error);
        res.status(400).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật',
            error: error.message
        });
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const property = await Property.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tin đăng'
            });
        }

        res.json({
            success: true,
            message: 'Xóa tin đăng thành công'
        });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(400).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa tin đăng',
            error: error.message
        });
    }
};

exports.getMyProperties = async (req, res) => {
    try {
        const properties = await Property.find({ owner: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: properties
        });
    } catch (error) {
        console.error('Get my properties error:', error);
        res.status(400).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách tin đăng',
            error: error.message
        });
    }
};

exports.getPropertyDetail = async (req, res) => {
    try {
        const property = await Property.findOne({
            _id: req.params.id,
            status: 'approved'
        }).populate('owner', 'name phone email');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài đăng hoặc bài đăng chưa được phê duyệt'
            });
        }

        res.json({
            success: true,
            data: property
        });
    } catch (error) {
        console.error('Get property detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin bài đăng',
            error: error.message
        });
    }
}; 