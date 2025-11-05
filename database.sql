DROP DATABASE IF EXISTS green_market;
CREATE DATABASE green_market;
USE green_market;


-- Main Users table with simplified structure
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('user', 'farmer', 'admin') NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Categories
CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table (used by farmers)
CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  category_id INT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  unit VARCHAR(50) DEFAULT 'kg',
  min_order_quantity DECIMAL(10,2) DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT NOT NULL DEFAULT 0,
  total_sold DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id),
  INDEX idx_category (category_id),
  INDEX idx_farmer (farmer_id),
  INDEX idx_active (is_active),
  INDEX idx_name (product_name)
);

-- Orders
CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_charge DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  final_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_method ENUM('cod', 'online', 'upi', 'card') DEFAULT 'cod',
  delivery_address TEXT NOT NULL,
  delivery_instructions TEXT,
  expected_delivery_date DATE,
  delivered_date TIMESTAMP NULL,
  tracking_id VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_user (user_id),
  INDEX idx_order_date (order_date)
);

-- Order Items
CREATE TABLE order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  farmer_id INT,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  FOREIGN KEY (farmer_id) REFERENCES users(user_id),
  INDEX idx_order (order_id),
  INDEX idx_product (product_id)
);

-- Order Tracking
CREATE TABLE order_tracking (
  tracking_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_created (created_at)
);

-- Reviews
CREATE TABLE reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  images TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT uniq_review_per_user UNIQUE (product_id, user_id),
  INDEX idx_review_product (product_id),
  INDEX idx_review_user (user_id)
);

-- Wishlist
CREATE TABLE wishlist (
  wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  UNIQUE KEY unique_wishlist (user_id, product_id),
  INDEX idx_user (user_id)
);

-- Notifications
CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('order', 'product', 'review', 'account', 'promotion') DEFAULT 'order',
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created (created_at)
);

-- Coupons
CREATE TABLE coupons (
  coupon_id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0.00,
  max_discount DECIMAL(10,2),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_code (code),
  INDEX idx_active (is_active)
);

-- Contact Messages
CREATE TABLE contact_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status ENUM('new', 'in_progress', 'resolved') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

-- -------------------------
-- 2) SAMPLE DATA WITH BCRYPT HASHED PASSWORDS
-- -------------------------

-- Password for all test users: pass123
-- Bcrypt hash: $2b$10$YourHashedPasswordHere (you need to generate these properly)
-- For now using plain text markers - YOU MUST HASH THESE IN PRODUCTION

INSERT INTO users (name, email, password, phone, address, role, is_active) VALUES
('Admin User', 'admin@greenmarket.com', '$2b$10$rLz4K7xKGvJx5qK5qK5qKOm7K8K9K0K1K2K3K4K5K6K7K8K9K0K1K', '9999999999', 'Admin Office, Green Market HQ', 'admin', TRUE),
('Alice Farmer', 'alice@gmail.com', '$2b$10$rLz4K7xKGvJx5qK5qK5qKOm7K8K9K0K1K2K3K4K5K6K7K8K9K0K1K', '9876543210', 'Green Valley Farm, Patna, Bihar', 'farmer', TRUE),
('Bob Customer', 'bob@gmail.com', '$2b$10$rLz4K7xKGvJx5qK5qK5qKOm7K8K9K0K1K2K3K4K5K6K7K8K9K0K1K', '9123456789', '123 Main Street, Patna, Bihar - 800001', 'user', TRUE),
('Charlie Farmer', 'charlie@gmail.com', '$2b$10$rLz4K7xKGvJx5qK5qK5qKOm7K8K9K0K1K2K3K4K5K6K7K8K9K0K1K', '9988776655', 'Fresh Fields Farm, Danapur, Bihar', 'farmer', TRUE),
('David Customer', 'david@gmail.com', '$2b$10$rLz4K7xKGvJx5qK5qK5qKOm7K8K9K0K1K2K3K4K5K6K7K8K9K0K1K', '9765432109', '456 Park Road, Boring Road, Patna - 800020', 'user', TRUE),
('Emma Farmer', 'emma@gmail.com', '$2b$10$rLz4K7xKGvJx5qK5qK5qKOm7K8K9K0K1K2K3K4K5K6K7K8K9K0K1K', '9854321098', 'Organic Hills Farm, Gaya, Bihar', 'farmer', TRUE);

-- Insert Categories
INSERT INTO categories (category_name, description, image_url, display_order) VALUES
('Vegetables', 'Fresh farm vegetables grown organically', 'https://images.unsplash.com/photo-1540420773420-3366772f4999', 1),
('Fruits', 'Seasonal fresh fruits from local farms', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf', 2),
('Dairy', 'Pure dairy products from healthy cattle', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da', 3),
('Grains', 'Premium quality grains and cereals', 'https://images.unsplash.com/photo-1586201375761-83865001e31c', 4),
('Spices', 'Aromatic Indian spices and masalas', 'https://images.unsplash.com/photo-1596040033229-a0b761a27e48', 5),
('Oils', 'Pure cold-pressed cooking oils', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', 6),
('Pulses', 'High-quality lentils and pulses', 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9', 7),
('Eggs & Meat', 'Fresh poultry and farm eggs', 'https://images.unsplash.com/photo-1582169296194-e4d644c48063', 8);

-- Insert Sample Products (farmer_id = 2 is Alice, farmer_id = 4 is Charlie, farmer_id = 6 is Emma)
INSERT INTO products (farmer_id, product_name, category_id, description, price, quantity, image_url, unit, is_active) VALUES
-- Vegetables
(2, 'Organic Tomatoes', 1, 'Fresh red tomatoes from organic farm, rich in vitamins', 40.00, 150, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea', 'kg', TRUE),
(2, 'Green Capsicum', 1, 'Fresh green bell peppers, perfect for salads', 50.00, 100, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83', 'kg', TRUE),
(4, 'Fresh Carrots', 1, 'Crunchy and sweet organic carrots', 35.00, 120, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37', 'kg', TRUE),
(2, 'Spinach Leaves', 1, 'Fresh green spinach, rich in iron', 25.00, 90, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb', 'kg', TRUE),
(4, 'Potatoes', 1, 'Farm fresh potatoes, great for all dishes', 30.00, 250, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655', 'kg', TRUE),
(6, 'Onions', 1, 'Fresh red onions, essential kitchen ingredient', 28.00, 200, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb', 'kg', TRUE),
(2, 'Green Chillies', 1, 'Spicy green chillies, fresh from farm', 60.00, 50, 'https://images.unsplash.com/photo-1583852264449-74a4c8dc0f04', 'kg', TRUE),
(6, 'Cauliflower', 1, 'Fresh white cauliflower heads', 45.00, 80, 'https://images.unsplash.com/photo-1568584711271-f2c3ee5089de', 'kg', TRUE),

-- Fruits  
(4, 'Shimla Apples', 2, 'Sweet Shimla apples, premium quality', 120.00, 70, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6', 'kg', TRUE),
(4, 'Bananas', 2, 'Ripe yellow bananas, rich in potassium', 40.00, 150, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e', 'dozen', TRUE),
(6, 'Mangoes', 2, 'Sweet Alphonso mangoes, king of fruits', 150.00, 60, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716', 'kg', TRUE),
(4, 'papaya', 2, 'Juicy and fresh papaya, vitamin C rich', 80.00, 100, 'https://unsplash.com/photos/a-group-of-sliced-papaya-on-a-yellow-background-yqJ3GUrnq7s', 'kg', TRUE),
(6, 'Pomegranates', 2, 'Fresh pomegranates, full of antioxidants', 140.00, 50, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7', 'kg', TRUE),
(4, 'Grapes', 2, 'Sweet seedless grapes', 90.00, 80, 'https://images.unsplash.com/photo-1599819177442-d2a7dc3c03c7', 'kg', TRUE),

-- Dairy
(2, 'Fresh Milk', 3, 'Pure cow milk, daily fresh', 60.00, 100, 'https://images.unsplash.com/photo-1550583724-b2692b85b150', 'liter', TRUE),
(6, 'Paneer', 3, 'Homemade fresh paneer', 180.00, 40, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7', 'kg', TRUE),
(2, 'Curd/Dahi', 3, 'Fresh homemade curd', 50.00, 60, 'https://images.unsplash.com/photo-1628088062854-d1870b4553da', 'kg', TRUE),
(6, 'Ghee', 3, 'Pure desi cow ghee', 500.00, 30, 'https://images.unsplash.com/photo-1628773822990-202a7462a4b9', 'kg', TRUE),

-- Grains
(2, 'Basmati Rice', 4, 'Premium aged basmati rice', 80.00, 300, 'https://images.unsplash.com/photo-1586201375761-83865001e31c', 'kg', TRUE),
(4, 'Wheat Flour', 4, 'Premium quality wheat flour (atta)', 45.00, 250, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b', 'kg', TRUE),
(6, 'Brown Rice', 4, 'Healthy brown rice, high in fiber', 90.00, 150, 'https://images.unsplash.com/photo-1516684732162-798a0062be99', 'kg', TRUE),

-- Spices
(2, 'Red Chili Powder', 5, 'Spicy red chili powder', 120.00, 60, 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a', 'kg', TRUE),
(4, 'Turmeric Powder', 5, 'Pure organic turmeric powder', 100.00, 80, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7', 'kg', TRUE),
(6, 'Coriander Powder', 5, 'Aromatic coriander powder', 80.00, 70, 'https://images.unsplash.com/photo-1596040033229-a0b761a27e48', 'kg', TRUE),
(2, 'Garam Masala', 5, 'Traditional Indian garam masala blend', 150.00, 40, 'https://images.unsplash.com/photo-1596040033229-a0b761a27e48', 'kg', TRUE),

-- Oils
(4, 'Mustard Oil', 6, 'Pure cold-pressed mustard oil', 180.00, 90, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', 'liter', TRUE),
(6, 'Groundnut Oil', 6, 'Pure groundnut/peanut oil', 160.00, 100, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', 'liter', TRUE),
(2, 'Coconut Oil', 6, 'Pure virgin coconut oil', 200.00, 60, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', 'liter', TRUE),

-- Pulses
(4, 'Toor Dal', 7, 'Premium quality toor dal (pigeon peas)', 120.00, 200, 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9', 'kg', TRUE),
(2, 'Moong Dal', 7, 'Fresh green moong dal', 110.00, 180, 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9', 'kg', TRUE),
(6, 'Chana Dal', 7, 'High-quality split chickpeas', 100.00, 150, 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9', 'kg', TRUE),

-- Eggs
(6, 'Farm Fresh Eggs', 8, 'Fresh brown eggs from free-range chickens', 6.00, 500, 'https://images.unsplash.com/photo-1582169296194-e4d644c48063', 'piece', TRUE);

-- Insert Sample Orders
INSERT INTO orders (order_number, user_id, order_date, total_amount, delivery_charge, discount, final_amount, status, payment_status, payment_method, delivery_address, tracking_id, expected_delivery_date) VALUES
('GM2025001', 3, '2025-10-25 10:30:00', 200.00, 40.00, 20.00, 220.00, 'delivered', 'paid', 'online', '123 Main Street, Patna, Bihar - 800001', 'TRK1001', '2025-10-28'),
('GM2025002', 5, '2025-10-26 14:15:00', 150.00, 40.00, 0.00, 190.00, 'shipped', 'paid', 'upi', '456 Park Road, Boring Road, Patna - 800020', 'TRK1002', '2025-10-29'),
('GM2025003', 3, '2025-10-27 09:45:00', 500.00, 50.00, 50.00, 500.00, 'confirmed', 'paid', 'card', '123 Main Street, Patna, Bihar - 800001', 'TRK1003', '2025-10-30'),
('GM2025004', 5, '2025-10-28 16:20:00', 320.00, 40.00, 0.00, 360.00, 'pending', 'pending', 'cod', '456 Park Road, Boring Road, Patna - 800020', 'TRK1004', '2025-10-31');

-- Insert Order Items
INSERT INTO order_items (order_id, product_id, quantity, price, total_price, farmer_id) VALUES
(1, 1, 2, 40.00, 80.00, 2),
(1, 9, 1, 120.00, 120.00, 4),
(2, 19, 2, 80.00, 160.00, 2),
(3, 22, 2, 100.00, 200.00, 4),
(3, 17, 3, 60.00, 180.00, 2),
(4, 3, 3, 35.00, 105.00, 4),
(4, 7, 2, 60.00, 120.00, 2),
(4, 10, 2, 40.00, 80.00, 4);

-- Insert Order Tracking
INSERT INTO order_tracking (order_id, status, location, description) VALUES
(1, 'Order Placed', 'Green Market Warehouse', 'Your order has been received'),
(1, 'Confirmed', 'Green Market Warehouse', 'Order confirmed and being packed'),
(1, 'Packed', 'Green Market Warehouse', 'Your order has been packed'),
(1, 'Shipped', 'Patna Distribution Center', 'Package dispatched for delivery'),
(1, 'Out for Delivery', 'Boring Road, Patna', 'Package is out for delivery'),
(1, 'Delivered', '123 Main Street', 'Package delivered successfully'),
(2, 'Order Placed', 'Green Market Warehouse', 'Your order has been received'),
(2, 'Confirmed', 'Green Market Warehouse', 'Order confirmed and being packed'),
(2, 'Packed', 'Green Market Warehouse', 'Your order has been packed'),
(2, 'Shipped', 'Patna Distribution Center', 'Package dispatched for delivery'),
(3, 'Order Placed', 'Green Market Warehouse', 'Your order has been received'),
(3, 'Confirmed', 'Green Market Warehouse', 'Order confirmed and being packed'),
(4, 'Order Placed', 'Green Market Warehouse', 'Your order has been received');

-- Insert Sample Reviews
INSERT INTO reviews (product_id, user_id, rating, comment, is_verified_purchase, helpful_count) VALUES
(1, 3, 5, 'Excellent quality tomatoes! Very fresh and organic. Highly recommended!', TRUE, 15),
(9, 5, 4, 'Good apples, slightly expensive but worth it for the quality.', TRUE, 8),
(1, 5, 5, 'Best tomatoes I have bought online. Fresh and juicy!', TRUE, 12),
(19, 3, 5, 'Premium quality basmati rice. Perfect for biryani!', TRUE, 10),
(17, 5, 4, 'Good quality milk. Delivered fresh daily.', TRUE, 6),
(3, 3, 5, 'Sweet and crunchy carrots. Kids loved them!', TRUE, 7),
(10, 5, 5, 'Perfect bananas. Just the right ripeness.', TRUE, 9);

-- Insert Sample Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES
(3, 'Order Delivered', 'Your order #GM2025001 has been delivered successfully', 'order', TRUE, '/orders/1'),
(3, 'Order Confirmed', 'Your order #GM2025003 has been confirmed', 'order', FALSE, '/orders/3'),
(5, 'Order Shipped', 'Your order #GM2025002 is on the way', 'order', FALSE, '/orders/2'),
(5, 'New Product', 'Check out fresh pomegranates now available!', 'product', FALSE, '/products'),
(2, 'Low Stock Alert', 'Your product "Organic Tomatoes" is running low on stock', 'product', FALSE, '/farmer-dashboard'),
(4, 'New Order', 'You have received a new order for your products', 'order', FALSE, '/farmer-dashboard');

-- Insert Sample Coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_to, usage_limit, is_active) VALUES
('FIRST50', 'Get ₹50 off on your first order', 'fixed', 50.00, 200.00, 50.00, '2025-01-01', '2025-12-31', 1000, TRUE),
('FRESH20', 'Get 20% off on fresh vegetables', 'percentage', 20.00, 300.00, 100.00, '2025-01-01', '2025-12-31', NULL, TRUE),
('WELCOME100', 'Welcome bonus - ₹100 off', 'fixed', 100.00, 500.00, 100.00, '2025-01-01', '2025-06-30', 500, TRUE),
('FRUIT10', '10% off on all fruits', 'percentage', 10.00, 200.00, 50.00, '2025-01-01', '2025-12-31', NULL, TRUE);

-- Insert Sample Contact Messages
INSERT INTO contact_messages (name, email, subject, message, status) VALUES
('Rahul Kumar', 'rahul@example.com', 'Product Quality', 'I am very satisfied with the quality of products. Keep it up!', 'resolved'),
('Priya Singh', 'priya@example.com', 'Delivery Issue', 'My last order was delayed. Please improve delivery time.', 'in_progress'),
('Amit Sharma', 'amit@example.com', 'Want to become farmer', 'I want to register as a farmer. How can I do that?', 'new');

-- -------------------------
-- 3) TRIGGERS
-- -------------------------

DELIMITER $$

-- Update product rating on review insert
DROP TRIGGER IF EXISTS trg_review_after_insert$$
CREATE TRIGGER trg_review_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  UPDATE products p
  SET p.review_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = NEW.product_id),
      p.avg_rating = COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = NEW.product_id), 2), 0.00)
  WHERE p.product_id = NEW.product_id;
END$$

-- Update product rating on review update
DROP TRIGGER IF EXISTS trg_review_after_update$$
CREATE TRIGGER trg_review_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
  UPDATE products p
  SET p.review_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = NEW.product_id),
      p.avg_rating = COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = NEW.product_id), 2), 0.00)
  WHERE p.product_id = NEW.product_id;
END$$

-- Update product rating on review delete
DROP TRIGGER IF EXISTS trg_review_after_delete$$
CREATE TRIGGER trg_review_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
  UPDATE products p
  SET p.review_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = OLD.product_id),
      p.avg_rating = COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = OLD.product_id), 2), 0.00)
  WHERE p.product_id = OLD.product_id;
END$$

-- Generate order number before insert
DROP TRIGGER IF EXISTS trg_order_before_insert$$
CREATE TRIGGER trg_order_before_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    SET NEW.order_number = CONCAT('GM', YEAR(CURDATE()), LPAD(FLOOR(RAND() * 999999), 6, '0'));
  END IF;
END$$

-- Update product total_sold on order confirmation
DROP TRIGGER IF EXISTS trg_update_product_sold$$
CREATE TRIGGER trg_update_product_sold
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE products p
    INNER JOIN order_items oi ON p.product_id = oi.product_id
    SET p.total_sold = p.total_sold + oi.quantity
    WHERE oi.order_id = NEW.order_id;
  END IF;
END$$

-- Reduce product quantity when order is placed
DROP TRIGGER IF EXISTS trg_reduce_stock$$
CREATE TRIGGER trg_reduce_stock
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET quantity = quantity - NEW.quantity
  WHERE product_id = NEW.product_id;
END$$

DELIMITER ;

-- -------------------------
-- 4) VIEWS FOR ANALYTICS
-- -------------------------

CREATE OR REPLACE VIEW vw_popular_products AS
SELECT p.product_id, p.product_name, p.price, p.quantity, p.total_sold, p.avg_rating, p.review_count,
       c.category_name, u.name as farmer_name, p.image_url
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN users u ON p.farmer_id = u.user_id
WHERE p.is_active = TRUE
ORDER BY p.total_sold DESC, p.avg_rating DESC
LIMIT 20;

CREATE OR REPLACE VIEW vw_farmer_stats AS
SELECT u.user_id, u.name, u.email, u.phone,
       COUNT(DISTINCT p.product_id) as total_products,
       COALESCE(SUM(p.total_sold), 0) as total_items_sold,
       COALESCE(AVG(p.avg_rating), 0) as avg_product_rating,
       COUNT(DISTINCT oi.order_id) as total_orders
FROM users u
LEFT JOIN products p ON u.user_id = p.farmer_id AND p.is_active = TRUE
LEFT JOIN order_items oi ON u.user_id = oi.farmer_id
WHERE u.role = 'farmer' AND u.is_active = TRUE
GROUP BY u.user_id;

CREATE OR REPLACE VIEW vw_top_customers AS
SELECT u.user_id, u.name, u.email, u.phone,
       COUNT(DISTINCT o.order_id) as total_orders,
       COALESCE(SUM(o.final_amount), 0) as total_spent
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE u.role = 'user' AND u.is_active = TRUE
GROUP BY u.user_id
ORDER BY total_spent DESC
LIMIT 10;

-- -------------------------
-- 5) STORED PROCEDURES
-- -------------------------

DELIMITER $$

-- Get farmer's products with stats
DROP PROCEDURE IF EXISTS sp_get_farmer_products$$
CREATE PROCEDURE sp_get_farmer_products(IN p_farmer_id INT)
BEGIN
  SELECT p.*, c.category_name,
         COALESCE(p.avg_rating, 0) as avg_rating,
         COALESCE(p.review_count, 0) as review_count,
         COALESCE(p.total_sold, 0) as total_sold
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.category_id
  WHERE p.farmer_id = p_farmer_id
  ORDER BY p.created_at DESC;
END$$

-- Get order details with items
DROP PROCEDURE IF EXISTS sp_get_order_details$$
CREATE PROCEDURE sp_get_order_details(IN p_order_id INT)
BEGIN
  -- Get order info
  SELECT o.*, u.name as customer_name, u.email, u.phone, u.address as customer_address
  FROM orders o
  JOIN users u ON o.user_id = u.user_id
  WHERE o.order_id = p_order_id;
  
  -- Get order items
  SELECT oi.*, p.product_name, p.image_url, p.unit,
         u.name as farmer_name, u.phone as farmer_phone
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  LEFT JOIN users u ON oi.farmer_id = u.user_id
  WHERE oi.order_id = p_order_id;
  
  -- Get order tracking
  SELECT * FROM order_tracking
  WHERE order_id = p_order_id
  ORDER BY created_at ASC;
END$$

-- Get farmer dashboard statistics
DROP PROCEDURE IF EXISTS sp_farmer_dashboard_stats$$
CREATE PROCEDURE sp_farmer_dashboard_stats(IN p_farmer_id INT)
BEGIN
  -- Total products
  SELECT COUNT(*) as total_products FROM products WHERE farmer_id = p_farmer_id;
  
  -- Total sales amount
  SELECT COALESCE(SUM(oi.total_price), 0) as total_sales
  FROM order_items oi
  WHERE oi.farmer_id = p_farmer_id;
  
  -- Active orders
  SELECT COUNT(DISTINCT o.order_id) as active_orders
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  WHERE oi.farmer_id = p_farmer_id 
  AND o.status NOT IN ('delivered', 'cancelled');
  
  -- Low stock products
  SELECT COUNT(*) as low_stock_products 
  FROM products 
  WHERE farmer_id = p_farmer_id AND quantity < 10 AND is_active = TRUE;
END$$

DELIMITER ;

-- -------------------------
-- 6) INDEXES FOR PERFORMANCE
-- -------------------------

CREATE INDEX idx_products_active_category ON products(is_active, category_id);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_order_items_farmer ON order_items(farmer_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);

-- -------------------------
-- VERIFICATION QUERIES
-- -------------------------

SELECT '==================================' as Info;
SELECT 'DATABASE CREATED SUCCESSFULLY!' as Status;
SELECT '==================================' as Info;

SELECT 'TOTAL COUNTS:' as Info;
SELECT COUNT(*) as Total_Users FROM users;
SELECT COUNT(*) as Total_Products FROM products;
SELECT COUNT(*) as Total_Orders FROM orders;
SELECT COUNT(*) as Total_Categories FROM categories;
SELECT COUNT(*) as Total_Reviews FROM reviews;

SELECT '==================================' as Info;
SELECT 'SAMPLE USERS (Test Credentials):' as Info;
SELECT user_id, name, email, role, 'Password: pass123' as test_password FROM users ORDER BY user_id;

SELECT '==================================' as Info;
SELECT 'CATEGORIES:' as Info;
SELECT category_id, category_name, display_order FROM categories ORDER BY display_order;

SELECT '==================================' as Info;
SELECT 'SAMPLE PRODUCTS:' as Info;
SELECT p.product_id, p.product_name, p.price, p.quantity, p.unit,
       u.name as farmer_name, c.category_name, p.avg_rating, p.review_count
FROM products p
JOIN users u ON p.farmer_id = u.user_id
JOIN categories c ON p.category_id = c.category_id
ORDER BY p.product_id
LIMIT 10;

SELECT '==================================' as Info;
SELECT 'FARMER STATISTICS:' as Info;
SELECT * FROM vw_farmer_stats;

SELECT '==================================' as Info;
SELECT 'POPULAR PRODUCTS:' as Info;
SELECT product_name, farmer_name, category_name, avg_rating, total_sold 
FROM vw_popular_products 
LIMIT 5;

SELECT '==================================' as Info;
SELECT '✅ DATABASE SETUP COMPLETE!' as Status;
SELECT 'You can now start the backend and frontend servers' as NextStep;
SELECT '==================================' as Info;