const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helper function to handle both callback and promise-based queries
const queryPromise = (query, params) => {
  return new Promise((resolve, reject) => {
    if (db.query) {
      // Callback-based (mysql)
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve([results]);
      });
    } else if (db.execute) {
      // Promise-based (mysql2)
      db.execute(query, params)
        .then(results => resolve(results))
        .catch(err => reject(err));
    } else {
      reject(new Error('Database query method not found'));
    }
  });
};

// ============================================
// FARMER-SPECIFIC ROUTES
// ============================================

// Get orders for a specific farmer (simplified - for farmer dashboard)
router.get('/farmer/:farmerId', authenticateToken, async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Check if using simple or complex schema
    const query = `
      SELECT 
        oi.order_item_id,
        oi.order_id,
        oi.quantity,
        oi.price,
        oi.total_price,
        o.order_number,
        o.order_date,
        o.status,
        COALESCE(o.payment_status, 'pending') as payment_status,
        p.product_name,
        COALESCE(p.unit, 'kg') as unit,
        p.image_url,
        u.name as buyer_name,
        u.email as buyer_email,
        COALESCE(u.phone, bp.contact_info) as buyer_phone,
        COALESCE(u.address, bp.address) as buyer_address
      FROM OrderItem oi
      JOIN Orders o ON oi.order_id = o.order_id
      JOIN Product p ON oi.product_id = p.product_id
      LEFT JOIN BuyerProfile bp ON o.buyer_id = bp.buyer_id
      LEFT JOIN Users u ON bp.user_id = u.user_id
      WHERE oi.farmer_id = ?
      ORDER BY o.order_date DESC
    `;

    const [results] = await queryPromise(query, [farmerId]);
    res.json(results);
  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// BUYER/USER ROUTES
// ============================================

// Get user orders (works with both schemas)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify user access
    if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Try complex schema first
    let query = `
      SELECT o.*, 
             (SELECT COUNT(*) FROM OrderItem WHERE order_id = o.order_id) as item_count
      FROM Orders o
      JOIN BuyerProfile bp ON o.buyer_id = bp.buyer_id
      WHERE bp.user_id = ?
      ORDER BY o.order_date DESC
    `;

    try {
      const [orders] = await queryPromise(query, [userId]);

      // Get items for each order
      for (let order of orders) {
        const itemQuery = `
          SELECT oi.*, p.name as product_name, p.image_url
          FROM OrderItem oi
          JOIN Product p ON oi.product_id = p.product_id
          WHERE oi.order_id = ?
        `;
        const [items] = await queryPromise(itemQuery, [order.order_id]);
        order.items = items;
      }

      res.json(orders);
    } catch (error) {
      // Fallback to simple schema
      const simpleQuery = `
        SELECT 
          o.*,
          COUNT(oi.order_item_id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.order_id
        ORDER BY o.order_date DESC
      `;
      const [results] = await queryPromise(simpleQuery, [userId]);
      res.json(results);
    }
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID with tracking
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Try complex schema first
    const complexQuery = `
      SELECT o.*, bp.address, bp.contact_info, u.username, u.email
      FROM Orders o
      JOIN BuyerProfile bp ON o.buyer_id = bp.buyer_id
      JOIN Users u ON bp.user_id = u.user_id
      WHERE o.order_id = ?
    `;

    const simpleQuery = `
      SELECT o.*, u.name as customer_name, u.email, u.phone, u.address
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ?
    `;

    let order;
    try {
      const [results] = await queryPromise(complexQuery, [orderId]);
      order = results[0];
    } catch (error) {
      const [results] = await queryPromise(simpleQuery, [orderId]);
      order = results[0];
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify access
    if (req.user.role === 'buyer') {
      const buyerCheckQuery = 'SELECT * FROM BuyerProfile WHERE user_id = ?';
      try {
        const [buyers] = await queryPromise(buyerCheckQuery, [req.user.userId]);
        if (buyers.length === 0 || buyers[0].buyer_id !== order.buyer_id) {
          return res.status(403).json({ error: 'Not authorized' });
        }
      } catch (error) {
        // Simple schema - check user_id directly
        if (order.user_id !== req.user.userId) {
          return res.status(403).json({ error: 'Not authorized' });
        }
      }
    }

    // Get order items (try both schemas)
    let itemsQuery = `
      SELECT oi.*, p.name as product_name, p.image_url
      FROM OrderItem oi
      JOIN Product p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `;
    
    try {
      const [items] = await queryPromise(itemsQuery, [orderId]);
      order.items = items;
    } catch (error) {
      itemsQuery = `
        SELECT 
          oi.*,
          p.product_name,
          p.image_url,
          p.unit,
          u.name as farmer_name,
          u.phone as farmer_phone
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        LEFT JOIN users u ON oi.farmer_id = u.user_id
        WHERE oi.order_id = ?
      `;
      const [items] = await queryPromise(itemsQuery, [orderId]);
      order.items = items;
    }

    // Get tracking history (if exists)
    const trackingQuery = 'SELECT * FROM OrderTracking WHERE order_id = ? ORDER BY created_at ASC';
    try {
      const [tracking] = await queryPromise(trackingQuery, [orderId]);
      order.tracking = tracking;
    } catch (error) {
      order.tracking = [];
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ============================================
// CREATE ORDER (Enhanced)
// ============================================

// Create order (Works with both schemas)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, deliveryAddress, deliveryInstructions, paymentMethod, couponCode, delivery_address, payment_method } = req.body;
    const userId = req.user.userId;

    // Use either naming convention
    const finalDeliveryAddress = deliveryAddress || delivery_address;
    const finalPaymentMethod = paymentMethod || payment_method || 'COD';

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productId = item.productId || item.product_id;
      
      // Try both schemas
      let productQuery = 'SELECT * FROM Product WHERE product_id = ? AND is_active = TRUE';
      let product;
      
      try {
        const [products] = await queryPromise(productQuery, [productId]);
        product = products[0];
      } catch (error) {
        productQuery = 'SELECT * FROM products WHERE product_id = ? AND is_active = TRUE';
        const [products] = await queryPromise(productQuery, [productId]);
        product = products[0];
      }

      if (!product || product.quantity < item.quantity) {
        throw new Error(`Product ${productId} not available in requested quantity`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.product_id,
        quantity: item.quantity,
        price: product.price,
        totalPrice: itemTotal,
        farmerId: product.farmer_id
      });
    }

    // Calculate delivery charge
    const deliveryCharge = subtotal >= 500 ? 0 : 50;

    // Apply coupon if provided
    let discount = 0;
    if (couponCode) {
      const couponQuery = `
        SELECT * FROM Coupons 
        WHERE code = ? AND is_active = TRUE 
        AND valid_from <= CURDATE() AND valid_to >= CURDATE()
        AND (usage_limit IS NULL OR used_count < usage_limit)
      `;
      
      try {
        const [coupons] = await queryPromise(couponQuery, [couponCode]);
        if (coupons.length > 0) {
          const coupon = coupons[0];
          if (subtotal >= (coupon.min_order_amount || 0)) {
            if (coupon.discount_type === 'percentage') {
              discount = (subtotal * coupon.discount_value) / 100;
              if (coupon.max_discount) {
                discount = Math.min(discount, coupon.max_discount);
              }
            } else {
              discount = coupon.discount_value;
            }

            // Update coupon usage
            const updateCouponQuery = 'UPDATE Coupons SET used_count = used_count + 1 WHERE coupon_id = ?';
            await queryPromise(updateCouponQuery, [coupon.coupon_id]);
          }
        }
      } catch (error) {
        console.log('Coupon system not available');
      }
    }

    const finalAmount = subtotal + deliveryCharge - discount;
    const orderNumber = 'GM' + Date.now();

    // Try to get buyer_id (complex schema)
    let buyerId = null;
    try {
      const [buyers] = await queryPromise('SELECT * FROM BuyerProfile WHERE user_id = ?', [userId]);
      if (buyers.length > 0) {
        buyerId = buyers[0].buyer_id;
      }
    } catch (error) {
      // Simple schema - no buyer profile
    }

    // Calculate expected delivery date
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 3);
    const trackingId = 'TRK' + Date.now();

    // Insert order (adapt based on schema)
    let orderQuery, orderParams;
    
    if (buyerId) {
      // Complex schema
      orderQuery = `
        INSERT INTO Orders (order_number, total_amount, delivery_charge, discount, final_amount, 
                           status, payment_method, delivery_address, delivery_instructions, 
                           buyer_id, tracking_id, expected_delivery_date)
        VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?)
      `;
      orderParams = [
        orderNumber, subtotal, deliveryCharge, discount, finalAmount,
        finalPaymentMethod, finalDeliveryAddress, deliveryInstructions,
        buyerId, trackingId, expectedDeliveryDate.toISOString().split('T')[0]
      ];
    } else {
      // Simple schema
      orderQuery = `
        INSERT INTO orders (order_number, user_id, total_amount, delivery_charge, final_amount, 
                           status, payment_method, delivery_address)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
      `;
      orderParams = [orderNumber, userId, subtotal, deliveryCharge, finalAmount, finalPaymentMethod, finalDeliveryAddress];
    }

    const [orderResult] = await queryPromise(orderQuery, orderParams);
    const orderId = orderResult.insertId;

    // Insert order items (try both schemas)
    for (const item of orderItems) {
      let itemQuery = 'INSERT INTO OrderItem (quantity, price, total_price, order_id, product_id, farmer_id) VALUES (?, ?, ?, ?, ?, ?)';
      let itemParams = [item.quantity, item.price, item.totalPrice, orderId, item.productId, item.farmerId];
      
      try {
        await queryPromise(itemQuery, itemParams);
      } catch (error) {
        itemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price, total_price, farmer_id) VALUES (?, ?, ?, ?, ?, ?)';
        itemParams = [orderId, item.productId, item.quantity, item.price, item.totalPrice, item.farmerId];
        await queryPromise(itemQuery, itemParams);
      }

      // Update product quantity
      try {
        await queryPromise('UPDATE Product SET quantity = quantity - ?, total_sold = total_sold + ? WHERE product_id = ?',
          [item.quantity, item.quantity, item.productId]);
      } catch (error) {
        await queryPromise('UPDATE products SET quantity = quantity - ?, total_sold = total_sold + ? WHERE product_id = ?',
          [item.quantity, item.quantity, item.productId]);
      }
    }

    // Add tracking if table exists
    try {
      await queryPromise(
        'INSERT INTO OrderTracking (order_id, status, location, description) VALUES (?, ?, ?, ?)',
        [orderId, 'Order Placed', 'Green Market Warehouse', 'Your order has been received and is being processed']
      );
    } catch (error) {
      console.log('OrderTracking table not available');
    }

    // Create notification if table exists
    try {
      await queryPromise(
        'INSERT INTO Notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Order Placed', `Your order #${orderNumber} has been placed successfully`, 'order', `/order-tracking/${orderId}`]
      );
    } catch (error) {
      console.log('Notifications table not available');
    }

    res.status(201).json({ 
      message: 'Order placed successfully', 
      orderId,
      orderNumber,
      trackingId,
      finalAmount
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// ============================================
// UPDATE/CANCEL ORDERS
// ============================================

// Update order status (Admin/Farmer)
router.put('/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const { status, location, description } = req.body;
    const orderId = req.params.orderId;

    // Check role
    if (!['admin', 'farmer'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update order status (try both schemas)
    try {
      await queryPromise('UPDATE Orders SET status = ?, updated_at = NOW() WHERE order_id = ?', [status, orderId]);
    } catch (error) {
      await queryPromise('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
    }

    // Add tracking entry (if table exists)
    try {
      await queryPromise(
        'INSERT INTO OrderTracking (order_id, status, location, description) VALUES (?, ?, ?, ?)',
        [orderId, status, location || 'In Transit', description || `Order status updated to ${status}`]
      );
    } catch (error) {
      console.log('OrderTracking not available');
    }

    // Get order details for notification
    try {
      const [orders] = await queryPromise(`
        SELECT o.*, u.email, u.username, bp.user_id
        FROM Orders o
        JOIN BuyerProfile bp ON o.buyer_id = bp.buyer_id
        JOIN Users u ON bp.user_id = u.user_id
        WHERE o.order_id = ?
      `, [orderId]);

      if (orders.length > 0) {
        const order = orders[0];
        // Create notification
        await queryPromise(
          'INSERT INTO Notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
          [order.user_id, 'Order Status Updated', `Your order #${order.order_number} is now ${status}`, 'order', `/order-tracking/${orderId}`]
        );
      }
    } catch (error) {
      console.log('Notification creation skipped');
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order (Buyer)
router.put('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.userId;

    // Verify ownership (try both schemas)
    let order;
    try {
      const [orders] = await queryPromise(`
        SELECT o.* FROM Orders o
        JOIN BuyerProfile bp ON o.buyer_id = bp.buyer_id
        WHERE o.order_id = ? AND bp.user_id = ?
      `, [orderId, userId]);
      order = orders[0];
    } catch (error) {
      const [orders] = await queryPromise('SELECT * FROM orders WHERE order_id = ? AND user_id = ?', [orderId, userId]);
      order = orders[0];
    }

    if (!order) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Only allow cancellation if order is Pending or Confirmed
    if (!['Pending', 'Confirmed', 'pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    // Update order status
    try {
      await queryPromise('UPDATE Orders SET status = "Cancelled" WHERE order_id = ?', [orderId]);
    } catch (error) {
      await queryPromise('UPDATE orders SET status = "cancelled" WHERE order_id = ?', [orderId]);
    }

    // Restore product quantities
    let items;
    try {
      const [results] = await queryPromise('SELECT * FROM OrderItem WHERE order_id = ?', [orderId]);
      items = results;
    } catch (error) {
      const [results] = await queryPromise('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      items = results;
    }

    for (const item of items) {
      try {
        await queryPromise('UPDATE Product SET quantity = quantity + ?, total_sold = total_sold - ? WHERE product_id = ?',
          [item.quantity, item.quantity, item.product_id]);
      } catch (error) {
        await queryPromise('UPDATE products SET quantity = quantity + ?, total_sold = total_sold - ? WHERE product_id = ?',
          [item.quantity, item.quantity, item.product_id]);
      }
    }

    // Add tracking
    try {
      await queryPromise(
        'INSERT INTO OrderTracking (order_id, status, description) VALUES (?, ?, ?)',
        [orderId, 'Cancelled', 'Order cancelled by customer']
      );
    } catch (error) {
      console.log('OrderTracking not available');
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get all orders (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Try complex schema first
    let query = `
      SELECT o.*, u.username as customer_name, u.email
      FROM Orders o
      JOIN BuyerProfile bp ON o.buyer_id = bp.buyer_id
      JOIN Users u ON bp.user_id = u.user_id
      ORDER BY o.order_date DESC
    `;

    try {
      const [results] = await queryPromise(query, []);
      res.json(results);
    } catch (error) {
      // Fallback to simple schema
      query = `
        SELECT o.*, u.name as customer_name, u.email, u.phone
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.order_date DESC
      `;
      const [results] = await queryPromise(query, []);
      res.json(results);
    }
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;