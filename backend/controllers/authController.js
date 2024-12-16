const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role = 'user', phone } = req.body;

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Email đã được sử dụng' 
            });
        }

        // Tạo user mới
        const user = new User({
            name,
            email,
            password,
            role,
            phone
        });

        await user.save();

        // Tạo JWT token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone
                }
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi đăng ký tài khoản',
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra email và password đã được nhập
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu'
            });
        }

        // Tìm user theo email và lấy cả trường password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        // Kiểm tra mật khẩu
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi đăng nhập',
            error: error.message
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone
                }
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin người dùng',
            error: error.message
        });
    }
};

exports.upgradeToOwner = async (req, res) => {
    try {
        // Kiểm tra xem user đã là owner chưa
        if (req.user.role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản của bạn đã là chủ trọ'
            });
        }

        // Cập nhật role thành owner
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { role: 'owner' },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Nâng cấp tài khoản thành công',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone
                }
            }
        });
    } catch (error) {
        console.error('Upgrade to owner error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi nâng cấp tài khoản',
            error: error.message
        });
    }
}; 