const Property = require('../models/Property');
const User = require('../models/User');

// Quản lý bài đăng
exports.getAllProperties = async (req, res) => {
    try {
        const properties = await Property.find()
            .populate('owner', 'name email phone')
            .sort('-createdAt');

        res.json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (error) {
        console.error('Get all properties error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bài đăng',
            error: error.message
        });
    }
};

exports.getPendingProperties = async (req, res) => {
    try {
        const properties = await Property.find({ status: 'pending' })
            .populate('owner', 'name email phone')
            .sort('-createdAt');

        res.json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (error) {
        console.error('Get pending properties error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bài đăng chờ duyệt',
            error: error.message
        });
    }
};

exports.approveProperty = async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(
            req.params.id,
            { status: 'approved' },
            { new: true }
        ).populate('owner', 'name email phone');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài đăng'
            });
        }

        // TODO: Gửi email thông báo cho chủ trọ

        res.json({
            success: true,
            message: 'Đã phê duyệt bài đăng',
            data: property
        });
    } catch (error) {
        console.error('Approve property error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phê duyệt bài đăng',
            error: error.message
        });
    }
};

exports.rejectProperty = async (req, res) => {
    try {
        const { reason } = req.body;
        const property = await Property.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'rejected',
                rejectionReason: reason
            },
            { new: true }
        ).populate('owner', 'name email phone');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài đăng'
            });
        }

        // TODO: Gửi email thông báo cho chủ trọ

        res.json({
            success: true,
            message: 'Đã từ chối bài đăng',
            data: property
        });
    } catch (error) {
        console.error('Reject property error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối bài đăng',
            error: error.message
        });
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const property = await Property.findByIdAndDelete(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài đăng'
            });
        }

        res.json({
            success: true,
            message: 'Đã xóa bài đăng'
        });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bài đăng',
            error: error.message
        });
    }
};

// Quản lý người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort('-createdAt');

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách người dùng',
            error: error.message
        });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'owner', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role không hợp lệ'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            message: 'Đã cập nhật role người dùng',
            data: user
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật role người dùng',
            error: error.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Xóa tất cả bài đăng của user này
        await Property.deleteMany({ owner: req.params.id });

        res.json({
            success: true,
            message: 'Đã xóa người dùng và tất cả bài đăng của họ'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa người dùng',
            error: error.message
        });
    }
};

// Thống kê
exports.getStats = async (req, res) => {
    try {
        const stats = {
            users: {
                total: await User.countDocuments(),
                owners: await User.countDocuments({ role: 'owner' }),
                normalUsers: await User.countDocuments({ role: 'user' })
            },
            properties: {
                total: await Property.countDocuments(),
                pending: await Property.countDocuments({ status: 'pending' }),
                approved: await Property.countDocuments({ status: 'approved' }),
                rejected: await Property.countDocuments({ status: 'rejected' })
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê',
            error: error.message
        });
    }
}; 