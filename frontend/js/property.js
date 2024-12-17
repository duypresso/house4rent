class PropertyService {
    static async createProperty(formData) {
        try {
            const response = await Auth.makeAuthenticatedRequest('/properties', {
                method: 'POST',
                body: JSON.stringify(formData),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });

            return response;
        } catch (error) {
            console.error('Create property error:', error);
            throw error;
        }
    }

    static async updateProperty(id, formData) {
        try {
            const response = await Auth.makeAuthenticatedRequest(`/properties/${id}`, {
                method: 'PUT',
                body: JSON.stringify(formData),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });

            return response;
        } catch (error) {
            console.error('Update property error:', error);
            throw error;
        }
    }

    static async deleteProperty(id) {
        try {
            const response = await Auth.makeAuthenticatedRequest(`/properties/${id}`, {
                method: 'DELETE'
            });

            return response;
        } catch (error) {
            console.error('Delete property error:', error);
            throw error;
        }
    }

    static async getMyProperties() {
        try {
            const response = await Auth.makeAuthenticatedRequest('/properties/my-properties');
            return response;
        } catch (error) {
            console.error('Get my properties error:', error);
            throw error;
        }
    }

    static async uploadImages(files) {
        try {
            const uploadPromises = files.map(file => {
                return new Promise((resolve, reject) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', 'xvo2f3vf');
                    formData.append('folder', 'nhasinhvien/properties');

                    fetch(`https://api.cloudinary.com/v1_1/dspjslyw6/image/upload`, {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.secure_url) {
                            resolve(data.secure_url);
                        } else {
                            reject(new Error('Upload failed'));
                        }
                    })
                    .catch(reject);
                });
            });

            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Upload images error:', error);
            throw error;
        }
    }
}

// Xử lý form đăng tin
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.submit-btn');
    const form = e.target;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        // Lấy files ảnh
        const imageFiles = Array.from(document.getElementById('imageUpload').files);
        if (imageFiles.length === 0) {
            throw new Error('Vui lòng chọn ít nhất 1 ảnh');
        }
        if (imageFiles.length > 5) {
            throw new Error('Chỉ được chọn tối đa 5 ảnh');
        }

        // Upload ảnh lên Cloudinary
        console.log('Uploading images...');
        const imageUrls = await PropertyService.uploadImages(imageFiles);
        console.log('Upload complete:', imageUrls);

        // Tạo object dữ liệu
        const formData = {
            name: form.name.value,
            address: form.address.value,
            district: form.district.value,
            ward: form.ward.value,
            description: form.description.value,
            contactPhone: form.contactPhone.value,
            latitude: parseFloat(form.latitude.value),
            longitude: parseFloat(form.longitude.value),
            closeTime: form.closeTime.value,
            images: imageUrls,
            location: {
                type: 'Point',
                coordinates: [parseFloat(form.longitude.value), parseFloat(form.latitude.value)]
            },
            facilities: {
                inventory: Array.from(form.querySelectorAll('input[name="inventory"]:checked')).map(input => input.value),
                numBedrooms: parseInt(form.numBedrooms.value),
                bathroom: {
                    hasShower: form.querySelector('input[name="bathroom.hasShower"]').checked,
                    hasBathtub: form.querySelector('input[name="bathroom.hasBathtub"]').checked,
                    hasPrivateToilet: form.querySelector('input[name="bathroom.hasPrivateToilet"]').checked
                },
                deposit: {
                    required: form.querySelector('input[name="deposit.required"]').checked,
                    amount: parseInt(form.querySelector('input[name="deposit.amount"]')?.value || 0)
                },
                utilityCosts: Array.from(form.querySelectorAll('.utility-cost-item')).map(item => ({
                    name: item.querySelector('input[name="utilityName[]"]').value,
                    cost: parseInt(item.querySelector('input[name="utilityCost[]"]').value)
                })).filter(item => item.name && item.cost)
            },
            acceptableVehicles: Array.from(form.querySelectorAll('input[name="acceptableVehicles"]:checked')).map(input => input.value)
        };

        // Kiểm tra dữ liệu quận và phường
        if (!formData.district || formData.district === "") {
            throw new Error('Vui lòng chọn quận');
        }
        if (!formData.ward || formData.ward === "") {
            throw new Error('Vui lòng nhập phường');
        }

        // Kiểm tra tọa độ
        if (!formData.location.coordinates[0] || !formData.location.coordinates[1]) {
            throw new Error('Vui lòng chọn vị trí trên bản đồ');
        }

        // Log dữ liệu để debug
        console.log('Form data:', {
            district: formData.district,
            ward: formData.ward,
            coordinates: formData.location.coordinates
        });

        // Gửi request tạo tin đăng
        console.log('Creating property...', formData);
        const response = await PropertyService.createProperty(formData);

        if (response.success) {
            alert('Đăng tin thành công! Bài đăng của bạn đang chờ phê duyệt.');
            window.location.href = '/index.html';
        } else {
            throw new Error(response.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Post error:', error);
        alert(error.message || 'Có lỗi xảy ra khi đăng tin');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Đăng tin';
    }
}); 