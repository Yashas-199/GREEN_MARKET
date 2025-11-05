const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Total users
    const [users] = await db.query('SELECT COUNT(*) as count FROM Users WHERE is_active = TRUE');
    
    // Total products
    const [products] = await db.query('SELECT COUNT(*) as count FROM Product WHERE is_active = TRUE');
    
    // Total orders
    const [orders] = await db.query('SELECT COUNT(*) as count, SUM(final_amount) as revenue FROM Orders');
    
    // Orders by status
    const [ordersByStatus] = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM Orders 
      GROUP BY status
    `);
    
    // Recent orders
    const [recentOrders] = await db.query(`
      SELECT o.*, u.username, u.email
      FROM Orders o
      JOIN BuyerProfile bp ON o.buyer_id = bp.buyer_id
      JOIN Users u ON bp.user_id = u.user_id
      ORDER BY o.order_date DESC
      LIMIT 10
    `);
    
    // Top selling products
    const [topProducts] = await db.query(`
      SELECT p.*, c.name as category_name
      FROM Product p
      LEFT JOIN Category c ON p.category_id = c.category_id
      WHERE p.is_active = TRUE
      ORDER BY p.total_sold DESC
      LIMIT 10
    `);
    
    // Monthly revenue
    const [monthlyRevenue] = await db.query(`
      SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(final_amount) as revenue,
        COUNT(*) as order_count
      FROM Orders
      WHERE status != 'Cancelled'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);

    res.json({
      totalUsers: users[0].count,
      totalProducts: products[0].count,
      totalOrders: orders[0].count,
      totalRevenue: orders[0].revenue || 0,
      ordersByStatus,
      recentOrders,
      topProducts,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.*, 
             CASE 
               WHEN u.role = 'buyer' THEN bp.address
               WHEN u.role = 'farmer' THEN fp.farm_location
               ELSE NULL
             END as location
      FROM Users u
      LEFT JOIN BuyerProfile bp ON u.user_id = bp.user_id
      LEFT JOIN FarmerProfile fp ON u.user_id = fp.user_id
      ORDER BY u.created_at DESC
    `);
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status
router.put('/users/:userId/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { is_active } = req.body;
    const userId = req.params.userId;

    await db.query(
      'UPDATE Users SET is_active = ? WHERE user_id = ?',
      [is_active, userId]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get all orders
router.get('/orders', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = `
      SELECT o.*, u.username, u.email, bp.contact_info
      FROM Orders o
      JOIN BuyerProfile bp ON o.buyer_id = bp.buyer_id
      JOIN Users u ON bp.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (startDate) {
      query += ' AND DATE(o.order_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(o.order_date) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY o.order_date DESC';

    const [orders] = await db.query(query, params);
    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Manage categories
router.post('/categories', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, image_url, display_order } = req.body;

    const [result] = await db.query(
      'INSERT INTO Category (name, description, image_url, display_order) VALUES (?, ?, ?, ?)',
      [name, description, image_url, display_order || 0]
    );

    res.status(201).json({ 
      message: 'Category created successfully',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, image_url, display_order } = req.body;
    const categoryId = req.params.id;

    await db.query(
      'UPDATE Category SET name = ?, description = ?, image_url = ?, display_order = ? WHERE category_id = ?',
      [name, description, image_url, display_order, categoryId]
    );

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if category has products
    const [products] = await db.query(
      'SELECT COUNT(*) as count FROM Product WHERE category_id = ?',
      [categoryId]
    );

    if (products[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }

    await db.query('DELETE FROM Category WHERE category_id = ?', [categoryId]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Coupon management
router.get('/coupons', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [coupons] = await db.query('SELECT * FROM Coupons ORDER BY created_at DESC');
    res.json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

router.post('/coupons', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_to, usage_limit } = req.body;

    const [result] = await db.query(
      `INSERT INTO Coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_to, usage_limit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_to, usage_limit]
    );

    res.status(201).json({ 
      message: 'Coupon created successfully',
      couponId: result.insertId
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

router.put('/coupons/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { is_active } = req.body;
    const couponId = req.params.id;

    await db.query(
      'UPDATE Coupons SET is_active = ? WHERE coupon_id = ?',
      [is_active, couponId]
    );

    res.json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// Contact messages
router.get('/messages', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [messages] = await db.query(`
      SELECT * FROM ContactMessages 
      ORDER BY created_at DESC
    `);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.put('/messages/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const messageId = req.params.id;

    await db.query(
      'UPDATE ContactMessages SET status = ? WHERE message_id = ?',
      [status, messageId]
    );

    res.json({ message: 'Message status updated successfully' });
  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

module.exports = router;