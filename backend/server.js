// ==========================================
// backend/server.js - ENHANCED WITH SOCKET.IO
// ==========================================
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible to routes
app.set('io', io);

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });

  // Join room for specific order tracking
  socket.on('trackOrder', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`📦 Client tracking order: ${orderId}`);
  });
});

// Import Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const farmerRoutes = require('./routes/farmerRoutes');

// Optional routes (create these if needed)
let orderRoutes, reviewRoutes, adminRoutes, notificationRoutes, wishlistRoutes;

try {
  orderRoutes = require('./routes/orders');
} catch (err) {
  console.log('⚠️ Orders route not found - skipping');
}

try {
  reviewRoutes = require('./routes/reviews');
} catch (err) {
  console.log('⚠️ Reviews route not found - skipping');
}

try {
  adminRoutes = require('./routes/admin');
} catch (err) {
  console.log('⚠️ Admin route not found - skipping');
}

try {
  notificationRoutes = require('./routes/notifications');
} catch (err) {
  console.log('⚠️ Notifications route not found - skipping');
}

try {
  wishlistRoutes = require('./routes/wishlist');
} catch (err) {
  console.log('⚠️ Wishlist route not found - skipping');
}

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/farmer', farmerRoutes);

if (orderRoutes) app.use('/api/orders', orderRoutes);
if (reviewRoutes) app.use('/api/reviews', reviewRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (notificationRoutes) app.use('/api/notifications', notificationRoutes);
if (wishlistRoutes) app.use('/api/wishlist', wishlistRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Green Market API v2.0 - Enhanced',
    timestamp: new Date().toISOString(),
    socketConnected: io.engine.clientsCount,
    routes: {
      auth: '✅',
      products: '✅',
      farmer: '✅',
      orders: orderRoutes ? '✅' : '❌',
      reviews: reviewRoutes ? '✅' : '❌',
      admin: adminRoutes ? '✅' : '❌',
      notifications: notificationRoutes ? '✅' : '❌',
      wishlist: wishlistRoutes ? '✅' : '❌'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Green Market Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔌 Socket.IO enabled for real-time updates`);
  console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
});

module.exports = { app, io };