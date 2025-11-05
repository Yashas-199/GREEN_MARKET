const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user wishlist
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify access
    if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const [wishlist] = await db.query(`
      SELECT w.*, p.*, c.name as category_name, 
             fp.farm_name, u.username as farmer_name
      FROM Wishlist w
      JOIN Product p ON w.product_id = p.product_id
      LEFT JOIN Category c ON p.category_id = c.category_id
      LEFT JOIN FarmerProfile fp ON p.farmer_id = fp.farmer_id
      LEFT JOIN Users u ON fp.user_id = u.user_id
      WHERE w.user_id = ? AND p.is_active = TRUE
      ORDER BY w.added_at DESC
    `, [userId]);

    res.json(wishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add to wishlist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userId;

    // Check if already in wishlist
    const [existing] = await db.query(
      'SELECT * FROM Wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    await db.query(
      'INSERT INTO Wishlist (user_id, product_id) VALUES (?, ?)',
      [userId, productId]
    );

    res.status(201).json({ message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove from wishlist
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.userId;

    const [result] = await db.query(
      'DELETE FROM Wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not in wishlist' });
    }

    res.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.userId;

    const [result] = await db.query(
      'SELECT * FROM Wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    res.json({ inWishlist: result.length > 0 });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

module.exports = router;