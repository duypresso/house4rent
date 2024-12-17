const Property = require('../models/Property');

// Hàm lấy tọa độ trung tâm của quận
function getDistrictCoordinates(district) {
    // Tọa độ trung tâm các quận ở TP.HCM
    const districtCoordinates = {
        'Quận 1': { latitude: 10.7756587, longitude: 106.7004238 },
        'Quận 2': { latitude: 10.7872729, longitude: 106.7498316 },
        'Quận 3': { latitude: 10.7843695, longitude: 106.6844089 },
        'Quận 4': { latitude: 10.7578263, longitude: 106.7017555 },
        'Quận 5': { latitude: 10.7540279, longitude: 106.6633746 },
        'Quận 6': { latitude: 10.7480929, longitude: 106.6352362 },
        'Quận 7': { latitude: 10.7340344, longitude: 106.7215787 },
        'Quận 8': { latitude: 10.7224138, longitude: 106.6283734 },
        'Quận 9': { latitude: 10.8428402, longitude: 106.8286851 },
        'Quận 10': { latitude: 10.7745965, longitude: 106.6679542 },
        'Quận 11': { latitude: 10.7665873, longitude: 106.6501669 },
        'Quận 12': { latitude: 10.8671531, longitude: 106.6413322 },
        'Quận Bình Tân': { latitude: 10.7652581, longitude: 106.6038273 },
        'Quận Bình Thạnh': { latitude: 10.8113797, longitude: 106.7091461 },
        'Quận Gò Vấp': { latitude: 10.8386779, longitude: 106.6652112 },
        'Quận Phú Nhuận': { latitude: 10.7991944, longitude: 106.6802639 },
        'Quận Tân Bình': { latitude: 10.8014659, longitude: 106.6525974 },
        'Quận Tân Phú': { latitude: 10.7900517, longitude: 106.6281901 },
        'Thành phố Thủ Đức': { latitude: 10.8493898, longitude: 106.7542772 }
    };

    // Chuẩn hóa tên quận để tìm kiếm
    let normalizedDistrict = district;
    if (!normalizedDistrict.startsWith('Quận') && !normalizedDistrict.startsWith('Thành phố')) {
        normalizedDistrict = 'Quận ' + normalizedDistrict;
    }
    
    console.log('Normalized district:', normalizedDistrict);
    return districtCoordinates[normalizedDistrict];
}

exports.getApprovedProperties = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search,
            district,
            radius,
            bedrooms,
            inventory,
            vehicles,
            sort = 'newest'
        } = req.query;
        
        console.log('Received search params:', { 
            search, district, radius, bedrooms, inventory, vehicles, sort 
        });
        
        // Xây dựng query
        let query = { status: 'approved' };
        let conditions = [];

        // Điều kiện status approved luôn được thêm vào
        conditions.push({ status: 'approved' });
        
        // Tìm kiếm theo từ khóa
        if (search) {
            conditions.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { address: { $regex: search, $options: 'i' } },
                    { district: { $regex: search, $options: 'i' } },
                    { ward: { $regex: search, $options: 'i' } }
                ]
            });
        }

        // Lọc theo quận
        if (district) {
            let districtName = district;
            if (!districtName.startsWith('Quận') && !districtName.startsWith('Thành phố')) {
                districtName = 'Quận ' + districtName;
            }
            
            conditions.push({
                district: { $regex: `^${districtName}$`, $options: 'i' }
            });

            // Nếu có bán kính tìm kiếm
            if (radius && radius !== '') {
                const radiusInKm = parseInt(radius) / 1000; // Chuyển đổi từ mét sang km
                const districtCoordinates = getDistrictCoordinates(district);
                if (districtCoordinates) {
                    conditions.push({
                        location: {
                            $geoWithin: {
                                $centerSphere: [
                                    [districtCoordinates.longitude, districtCoordinates.latitude],
                                    radiusInKm / 6371 // Chia cho bán kính trái đất (6371 km) để chuyển đổi sang radian
                                ]
                            }
                        }
                    });
                }
            }
        }

        // Lọc theo số phòng ngủ
        if (bedrooms) {
            if (bedrooms === '4') {
                conditions.push({ 'facilities.numBedrooms': { $gte: 4 } });
            } else {
                conditions.push({ 'facilities.numBedrooms': parseInt(bedrooms) });
            }
        }

        // Lọc theo tiện ích
        if (inventory) {
            const inventoryList = JSON.parse(inventory);
            if (inventoryList.length > 0) {
                conditions.push({ 'facilities.inventory': { $all: inventoryList } });
            }
        }

        // Lọc theo phương tiện
        if (vehicles) {
            const vehicleList = JSON.parse(vehicles);
            if (vehicleList.length > 0) {
                conditions.push({ acceptableVehicles: { $all: vehicleList } });
            }
        }

        // Kết hợp tất cả điều kiện bằng $and
        query = conditions.length > 0 ? { $and: conditions } : query;

        console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

        // Xác định cách sắp xếp
        let sortOption = {};
        switch (sort) {
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'newest':
            default:
                sortOption = { createdAt: -1 };
        }

        // Thực hiện query với phân trang
        const properties = await Property.find(query)
            .populate('owner', 'name phone email')
            .sort(sortOption)
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
                message: 'Không tìm thấy bài đăng hoặc bài đăng chưa đư���c phê duyệt'
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