import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories/all'),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getUserOrders: (userId) => api.get(`/orders/user/${userId}`),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  updateStatus: (orderId, statusData) => api.put(`/orders/${orderId}/status`, statusData),
  cancel: (orderId) => api.put(`/orders/${orderId}/cancel`),
  getFarmerOrders: () => api.get('/farmer/orders'),
};

// Reviews API
export const reviewsAPI = {
  add: (reviewData) => api.post('/reviews', reviewData),
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
  getBuyerReviews: (buyerUserId) => api.get(`/reviews/buyer/${buyerUserId}`),
  update: (reviewId, reviewData) => api.put(`/reviews/${reviewId}`, reviewData),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

// Notifications API
export const notificationsAPI = {
  getUserNotifications: (userId) => api.get(`/notifications/user/${userId}`),
  getUnreadCount: (userId) => api.get(`/notifications/user/${userId}/unread-count`),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.put(`/notifications/user/${userId}/read-all`),
  delete: (notificationId) => api.delete(`/notifications/${notificationId}`),
};

// Wishlist API
export const wishlistAPI = {
  getUserWishlist: (userId) => api.get(`/wishlist/user/${userId}`),
  add: (productId) => api.post('/wishlist', { productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  check: (productId) => api.get(`/wishlist/check/${productId}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (userId, statusData) => api.put(`/admin/users/${userId}/status`, statusData),
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (couponData) => api.post('/admin/coupons', couponData),
  updateCoupon: (couponId, couponData) => api.put(`/admin/coupons/${couponId}`, couponData),
  getMessages: () => api.get('/admin/messages'),
  updateMessageStatus: (messageId, statusData) => api.put(`/admin/messages/${messageId}/status`, statusData),
};

export default api;