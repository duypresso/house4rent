class Auth {
    static API_URL = window.location.origin + '/api';

    static async login(email, password) {
        try {
            console.log('Sending login request to:', `${this.API_URL}/auth/login`);
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);
            
            if (data.success) {
                // Lưu token và user vào localStorage
                this.setAuthData(data.data.token, data.data.user);
                return { 
                    success: true, 
                    data: data.data,
                    message: 'Đăng nhập thành công'
                };
            } else {
                return { 
                    success: false, 
                    message: data.message || 'Đăng nhập không thành công' 
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: 'Có lỗi xảy ra khi đăng nhập' 
            };
        }
    }

    static setAuthData(token, user) {
        try {
            if (!token || !user) {
                console.error('Invalid auth data:', { token, user });
                return;
            }
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            console.log('Auth data saved:', { token, user });
        } catch (error) {
            console.error('Error saving auth data:', error);
        }
    }

    static clearAuthData() {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('Auth data cleared');
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    }

    static isAuthenticated() {
        try {
            console.log('Checking authentication status...');
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            
            if (!token || !userStr) {
                console.log('Missing token or user data');
                return false;
            }

            try {
                const user = JSON.parse(userStr);
                if (!user || !user.role) {
                    console.log('Invalid user data:', user);
                    this.clearAuthData();
                    return false;
                }
                console.log('User is authenticated:', user);
                return true;
            } catch (e) {
                console.error('Error parsing user data:', e);
                this.clearAuthData();
                return false;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.clearAuthData();
            return false;
        }
    }

    static getUser() {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                console.log('No user data found');
                return null;
            }
            const user = JSON.parse(userStr);
            if (!user || !user.role) {
                console.log('Invalid user data:', user);
                this.clearAuthData();
                return null;
            }
            return user;
        } catch (error) {
            console.error('Error getting user data:', error);
            this.clearAuthData();
            return null;
        }
    }

    static getToken() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found');
        }
        return token;
    }

    static logout() {
        console.log('Logging out...');
        this.clearAuthData();
        if (window.location.pathname !== '/login.html') {
            window.location.href = '/login.html';
        }
    }

    static async checkAuthStatus() {
        try {
            console.log('Checking auth status with server...');
            const token = this.getToken();
            if (!token) {
                console.log('No token found, clearing auth data');
                this.clearAuthData();
                return false;
            }

            const response = await fetch(`${this.API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            console.log('Auth check response:', data);
            
            if (!data.success) {
                console.log('Auth check failed:', data.message);
                this.clearAuthData();
                return false;
            }

            // Cập nhật thông tin user nếu có thay đổi
            this.setAuthData(token, data.data.user);
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            this.clearAuthData();
            return false;
        }
    }

    static async makeAuthenticatedRequest(endpoint, options = {}) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const defaultOptions = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await fetch(`${this.API_URL}${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            });

            if (response.status === 401) {
                this.clearAuthData();
                throw new Error('Unauthorized');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Request error:', error);
            if (error.message === 'Unauthorized') {
                this.clearAuthData();
            }
            throw error;
        }
    }

    static getRedirectUrl(role) {
        console.log('Getting redirect URL for role:', role);
        const url = role === 'admin' ? '/admin.html' :
                   role === 'owner' ? '/post.html' :
                   role === 'user' ? '/index.html' :
                   '/login.html';
        console.log('Redirect URL:', url);
        return url;
    }

    static redirectBasedOnRole() {
        console.log('Redirecting based on role...');
        const user = this.getUser();
        if (!user) {
            console.log('No user data found, staying on current page');
            return;
        }

        const currentUrl = window.location.pathname;
        const targetUrl = this.getRedirectUrl(user.role);
        
        console.log('Current URL:', currentUrl);
        console.log('Target URL:', targetUrl);
        
        // Chỉ chuyển hướng nếu đang ở trang login hoặc URL hiện tại không phù hợp với role
        if (currentUrl === '/login.html' || currentUrl !== targetUrl) {
            console.log('Redirecting to:', targetUrl);
            window.location.href = targetUrl;
        } else {
            console.log('Already on correct page');
        }
    }
}

// Export cho Node.js environment
if (typeof module !== 'undefined') {
    module.exports = Auth;
} 