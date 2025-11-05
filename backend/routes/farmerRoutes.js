const express = require('express');
const router = express.Router();
const db = require('../config/database').promise; // Get promise pool directly
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
    }
  }
});

// Get farmer dashboard stats
router.get('/dashboard/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Get product count
    const [products] = await db.query(
      'SELECT COUNT(*) as total FROM products WHERE farmer_id = ?',
      [farmerId]
    );

    // Get total sales
    const [sales] = await db.query(`
      SELECT COALESCE(SUM(oi.total_price), 0) as total_sales
      FROM order_items oi
      WHERE oi.farmer_id = ?
    `, [farmerId]);

    // Get active orders
    const [orders] = await db.query(`
      SELECT COUNT(DISTINCT o.order_id) as active_orders
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE oi.farmer_id = ? AND o.status NOT IN ('delivered', 'cancelled')
    `, [farmerId]);

    res.json({
      totalProducts: products[0].total,
      totalSales: parseFloat(sales[0].total_sales),
      activeOrders: orders[0].active_orders
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get all products by farmer
router.get('/products/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const [products] = await db.query(`
      SELECT p.*, c.category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.farmer_id = ?
      ORDER BY p.created_at DESC
    `, [farmerId]);

    res.json(products);
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Add new product
router.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { farmer_id, product_name, category_id, description, price, quantity, unit } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate required fields
    if (!farmer_id || !product_name || !category_id || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await db.query(`
      INSERT INTO products (farmer_id, product_name, category_id, description, price, quantity, image_url, unit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [farmer_id, product_name, category_id, description || null, parseFloat(price), parseFloat(quantity), image_url, unit || 'kg']);

    res.status(201).json({ 
      message: 'Product added successfully',
      product_id: result.insertId
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product
router.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category_id, description, price, quantity, unit } = req.body;
    let image_url = req.body.existing_image;

    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
      
      // Delete old image if exists
      if (req.body.existing_image && req.body.existing_image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', req.body.existing_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    await db.query(`
      UPDATE products 
      SET product_name = ?, category_id = ?, description = ?, price = ?, quantity = ?, image_url = ?, unit = ?
      WHERE product_id = ?
    `, [product_name, category_id, description || null, parseFloat(price), parseFloat(quantity), image_url, unit || 'kg', id]);

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get image path before deleting
    const [products] = await db.query('SELECT image_url FROM products WHERE product_id = ?', [id]);
    
    if (products.length > 0 && products[0].image_url && products[0].image_url.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', products[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.query('DELETE FROM products WHERE product_id = ?', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get farmer orders (authenticated)
router.get('/orders', authenticateToken, requireRole('farmer'), async (req, res) => {
  try {
    const farmerId = req.user.userId;

    const [orders] = await db.query(`
      SELECT DISTINCT o.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email, u.address as customer_address
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN users u ON o.user_id = u.user_id
      WHERE oi.farmer_id = ?
      ORDER BY o.order_date DESC
    `, [farmerId]);

    // Get order items for each order
    for (let order of orders) {
      const [items] = await db.query(`
        SELECT oi.*, p.product_name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ? AND oi.farmer_id = ?
      `, [order.order_id, farmerId]);
      
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get farmer orders by ID (for backward compatibility)
router.get('/orders/:farmerId', async (req, res) => {
  try {
    const { farmerId} = req.params;

    const [orders] = await db.query(`
      SELECT DISTINCT o.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email, u.address as customer_address
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN users u ON o.user_id = u.user_id
      WHERE oi.farmer_id = ?
      ORDER BY o.order_date DESC
    `, [farmerId]);

    // Get order items for each order
    for (let order of orders) {
      const [items] = await db.query(`
        SELECT oi.*, p.product_name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ? AND oi.farmer_id = ?
      `, [order.order_id, farmerId]);
      
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (farmer can update their order items)
router.put('/orders/:orderId/status', authenticateToken, requireRole('farmer'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const farmerId = req.user.userId;

    // Valid statuses
    const validStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update the order status (only if farmer has items in this order)
    const [result] = await db.query(`
      UPDATE orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      SET o.status = ?, o.updated_at = NOW()
      WHERE o.order_id = ? AND oi.farmer_id = ?
    `, [status, orderId, farmerId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found or not authorized' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;