const express = require('express');
const router = express.Router();
const db = require('../config/database').promise; // Get the promise-based connection

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, sortBy, minPrice, maxPrice, farmerId } = req.query;
    let query = `
      SELECT p.*, c.category_name, u.name as farmer_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN users u ON p.farmer_id = u.user_id
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ' AND (c.category_name = ? OR c.category_id = ?)';
      params.push(category, category);
    }

    if (search) {
      query += ' AND (p.product_name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    if (farmerId) {
      query += ' AND p.farmer_id = ?';
      params.push(parseInt(farmerId));
    }

    // Sorting
    const sortParam = sort || sortBy;
    if (sortParam === 'price_low') {
      query += ' ORDER BY p.price ASC';
    } else if (sortParam === 'price_high') {
      query += ' ORDER BY p.price DESC';
    } else if (sortParam === 'rating') {
      query += ' ORDER BY p.avg_rating DESC';
    } else if (sortParam === 'popular') {
      query += ' ORDER BY p.total_sold DESC';
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    console.log('Query:', query);
    console.log('Params:', params);

    const [products] = await db.query(query, params);
    console.log('Products found:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// Get all categories (both routes for compatibility) - MUST come before /:id route
router.get('/categories/all', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT c.*, COUNT(p.product_id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = TRUE
      GROUP BY c.category_id
      ORDER BY c.display_order, c.category_name
    `);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT c.*, COUNT(p.product_id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = TRUE
      GROUP BY c.category_id
      ORDER BY c.display_order, c.category_name
    `);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get featured/popular products - MUST come before /:id route
router.get('/featured/top', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.category_name, u.name as farmer_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN users u ON p.farmer_id = u.user_id
      WHERE p.is_active = TRUE
      ORDER BY p.total_sold DESC, p.avg_rating DESC
      LIMIT 8
    `);
    res.json(products);
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// Get products by farmer - MUST come before /:id route
router.get('/farmer/:farmerId', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch farmer products' });
  }
});

// Search products - MUST come before /:id route
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const searchQuery = `%${query}%`;
    
    const [products] = await db.query(`
      SELECT p.*, c.category_name, u.name as farmer_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN users u ON p.farmer_id = u.user_id
      WHERE (p.product_name LIKE ? OR p.description LIKE ? OR c.category_name LIKE ?)
      AND p.is_active = TRUE
      ORDER BY p.created_at DESC
    `, [searchQuery, searchQuery, searchQuery]);

    res.json(products);
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Get products by category - MUST come before /:id route
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const [products] = await db.query(`
      SELECT p.*, c.category_name, u.name as farmer_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN users u ON p.farmer_id = u.user_id
      WHERE p.category_id = ? AND p.is_active = TRUE
      ORDER BY p.created_at DESC
    `, [categoryId]);

    res.json(products);
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID - MUST come AFTER all specific routes
router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.category_name, 
             u.name as farmer_name, u.email as farmer_email, u.phone as farmer_phone, u.address as farmer_address
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN users u ON p.farmer_id = u.user_id
      WHERE p.product_id = ? AND p.is_active = TRUE
    `, [req.params.id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product (POST)
router.post('/', async (req, res) => {
  try {
    const { farmer_id, product_name, category_id, description, price, quantity, unit, image_url } = req.body;

    // Validate required fields
    if (!farmer_id || !product_name || !category_id || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await db.query(`
      INSERT INTO products (farmer_id, product_name, category_id, description, price, quantity, image_url, unit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [farmer_id, product_name, category_id, description || '', parseFloat(price), parseFloat(quantity), image_url || '', unit || 'kg']);

    res.status(201).json({ 
      message: 'Product added successfully',
      product_id: result.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// Update product (PUT)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category_id, description, price, quantity, unit, image_url } = req.body;

    // Validate required fields
    if (!product_name || !category_id || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await db.query(`
      UPDATE products 
      SET product_name = ?, category_id = ?, description = ?, price = ?, quantity = ?, image_url = ?, unit = ?
      WHERE product_id = ?
    `, [product_name, category_id, description || '', parseFloat(price), parseFloat(quantity), image_url || '', unit || 'kg', id]);

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// Delete product (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM products WHERE product_id = ?', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

// Get product reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;