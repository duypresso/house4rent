// Kiểm tra nếu đã đăng nhập thì chuyển hướng
console.log('Login page loaded');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, checking auth status...');
    
    // Xóa token và user data nếu đang ở trang login
    if (window.location.pathname === '/login.html') {
        console.log('On login page, clearing any existing auth data');
        Auth.clearAuthData();
    }
    
    // Kiểm tra trạng thái xác thực với server
    const isAuthenticated = await Auth.checkAuthStatus();
    console.log('Auth status:', isAuthenticated);
    
    if (isAuthenticated) {
        console.log('User is authenticated, checking role...');
        const user = Auth.getUser();
        if (user && user.role) {
            console.log('User role:', user.role);
            const targetUrl = Auth.getRedirectUrl(user.role);
            if (window.location.pathname !== targetUrl) {
                console.log('Redirecting to appropriate page:', targetUrl);
                window.location.href = targetUrl;
            }
        }
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Login form submitted');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.querySelector('.login-btn');
    
    try {
        // Disable button và hiển thị loading
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        errorMessage.style.display = 'none';

        console.log('Attempting login with:', { email });
        const result = await Auth.login(email, password);
        console.log('Login result:', result);
        
        if (result.success && result.data && result.data.user) {
            console.log('Login successful, user role:', result.data.user.role);
            const targetUrl = Auth.getRedirectUrl(result.data.user.role);
            console.log('Redirecting to:', targetUrl);
            window.location.href = targetUrl;
        } else {
            console.error('Login failed:', result.message);
            errorMessage.style.display = 'block';
            errorMessage.textContent = result.message || 'Đăng nhập không thành công';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Có lỗi xảy ra, vui lòng thử lại sau';
    } finally {
        // Restore button state
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
    }
}); 