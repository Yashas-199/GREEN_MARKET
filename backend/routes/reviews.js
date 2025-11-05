const express = require('express');
const router = express.Router();
const db = require('../config/database').promise;
const { authenticateToken, requireRole } = require('../middleware/auth');

// Add review (Buyer only)
router.post('/', authenticateToken, requireRole('buyer'), async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const buyerUserId = req.user.userId;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Call stored procedure (handles validation)
    await db.query(
      'CALL sp_add_review(?, ?, ?, ?)',
      [buyerUserId, productId, rating, comment]
    );

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    if (error.sqlMessage) {
      return res.status(400).json({ error: error.sqlMessage });
    }
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Get product reviews
router.get('/product/:productId', async (req, res) => {
  try {
    const [results] = await db.query(
      'CALL sp_get_product_reviews(?)',
      [req.params.productId]
    );
    
    res.json(results[0] || []);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get buyer reviews
router.get('/buyer/:buyerUserId', authenticateToken, async (req, res) => {
  try {
    const buyerUserId = req.params.buyerUserId;

    // Verify access
    if (req.user.userId !== parseInt(buyerUserId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const [results] = await db.query(
      'CALL sp_get_buyer_reviews(?)',
      [buyerUserId]
    );
    
    res.json(results[0] || []);
  } catch (error) {
    console.error('Get buyer reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Update review
router.put('/:reviewId', authenticateToken, requireRole('buyer'), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewId = req.params.reviewId;
    const userId = req.user.userId;

    // Verify ownership
    const [reviews] = await db.query(
      'SELECT * FROM Review WHERE review_id = ? AND buyer_user_id = ?',
      [reviewId, userId]
    );

    if (reviews.length === 0) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    await db.query(
      'UPDATE Review SET rating = ?, comment = ?, updated_at = NOW() WHERE review_id = ?',
      [rating, comment, reviewId]
    );

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:reviewId', authenticateToken, requireRole('buyer', 'admin'), async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.user.userId;

    if (req.user.role === 'buyer') {
      // Verify ownership
      const [reviews] = await db.query(
        'SELECT * FROM Review WHERE review_id = ? AND buyer_user_id = ?',
        [reviewId, userId]
      );

      if (reviews.length === 0) {
        return res.status(403).json({ error: 'Not authorized to delete this review' });
      }
    }

    await db.query('DELETE FROM Review WHERE review_id = ?', [reviewId]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;