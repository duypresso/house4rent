const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

// Import routes
const testRoute = require('./routes/testRoute');
const authRoute = require('./routes/authRoutes');
const propertyRoute = require('./routes/propertyRoutes');
const commentRoute = require('./routes/commentRoutes');
const adminRoute = require('./routes/adminRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Tạo tài khoản admin mặc định
const createAdminAccount = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@gmail.com' });
        if (!adminExists) {
            await User.create({
                name: 'Admin',
                email: 'admin@gmail.com',
                password: 'admin123',
                role: 'admin',
                phone: '0123456789'
            });
            console.log('Tài khoản admin đã được tạo:');
            console.log('Email: admin@gmail.com');
            console.log('Password: admin123');
        }
    } catch (error) {
        console.error('Lỗi tạo tài khoản admin:', error);
    }
};

createAdminAccount();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle favicon.ico request
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // Trả về status 204 No Content
});

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/test', testRoute);
app.use('/api/auth', authRoute);
app.use('/api/properties', propertyRoute);
app.use('/api/comments', commentRoute);
app.use('/api/admin', adminRoute);

// Frontend Routes - Serve index.html for all routes except /api
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        next();
    } else {
        res.sendFile(path.join(__dirname, '../frontend', req.path));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra từ phía server',
        error: err.message
    });
});

// Handle 404
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({
            success: false,
            message: 'API endpoint không tồn tại'
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 