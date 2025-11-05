const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    // Check if user already exists
    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkQuery, [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'User already registered, please login.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const insertQuery = `
        INSERT INTO users (name, email, password, phone, address, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      db.query(
        insertQuery,
        [name, email, hashedPassword, phone, address, role || 'user'],
        (err, result) => {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ message: 'Error creating user' });
          }

          res.status(201).json({
            message: 'Registration successful!',
            user: {
              user_id: result.insertId,
              name,
              email,
              role: role || 'user'
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = results[0];

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Return user data (excluding password)
      const userData = {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      };

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.user_id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'green_market_secret_key_2024',
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        user: userData,
        token: token
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;