-- ========================================
-- USER-DEFINED FUNCTIONS FOR GREEN_MARKET
-- ========================================

USE green_market;

-- -------------------------
-- 1) FUNCTION: Calculate Order Carbon Footprint
-- -------------------------
DELIMITER $$

DROP FUNCTION IF EXISTS fn_order_carbon_footprint$$
CREATE FUNCTION fn_order_carbon_footprint(p_order_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total_footprint DECIMAL(10,2);
    
    -- Calculate based on product weights (0.5 kg CO2 per kg of product)
    SELECT SUM(oi.quantity * 0.5) INTO total_footprint
    FROM order_items oi
    WHERE oi.order_id = p_order_id;
    
    RETURN IFNULL(total_footprint, 0.00);
END$$

DELIMITER ;

-- -------------------------
-- 2) FUNCTION: Get Product Average Rating
-- -------------------------
DELIMITER $$

DROP FUNCTION IF EXISTS fn_product_avg_rating$$
CREATE FUNCTION fn_product_avg_rating(p_product_id INT)
RETURNS DECIMAL(3,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    
    SELECT AVG(rating) INTO avg_rating
    FROM reviews
    WHERE product_id = p_product_id;
    
    RETURN IFNULL(avg_rating, 0.00);
END$$

DELIMITER ;

-- -------------------------
-- 3) FUNCTION: Calculate User Loyalty Level
-- -------------------------
DELIMITER $$

DROP FUNCTION IF EXISTS fn_user_loyalty_level$$
CREATE FUNCTION fn_user_loyalty_level(p_user_id INT)
RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE order_count INT;
    DECLARE total_spent DECIMAL(10,2);
    DECLARE loyalty_level VARCHAR(20);
    
    SELECT COUNT(*), COALESCE(SUM(final_amount), 0)
    INTO order_count, total_spent
    FROM orders
    WHERE user_id = p_user_id 
      AND status IN ('delivered', 'shipped', 'confirmed');
    
    IF total_spent >= 5000 THEN
        SET loyalty_level = 'Platinum';
    ELSEIF total_spent >= 2000 THEN
        SET loyalty_level = 'Gold';
    ELSEIF total_spent >= 1000 THEN
        SET loyalty_level = 'Silver';
    ELSEIF order_count >= 3 THEN
        SET loyalty_level = 'Bronze';
    ELSE
        SET loyalty_level = 'Regular';
    END IF;
    
    RETURN loyalty_level;
END$$

DELIMITER ;

-- -------------------------
-- 4) FUNCTION: Calculate Discount Amount
-- -------------------------
DELIMITER $$

DROP FUNCTION IF EXISTS fn_calculate_discount$$
CREATE FUNCTION fn_calculate_discount(
    p_order_amount DECIMAL(10,2),
    p_coupon_code VARCHAR(50)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE discount_amt DECIMAL(10,2) DEFAULT 0.00;
    DECLARE discount_type VARCHAR(20);
    DECLARE discount_value DECIMAL(10,2);
    DECLARE min_amount DECIMAL(10,2);
    DECLARE max_discount DECIMAL(10,2);
    
    -- Get coupon details
    SELECT c.discount_type, c.discount_value, c.min_order_amount, c.max_discount
    INTO discount_type, discount_value, min_amount, max_discount
    FROM coupons c
    WHERE c.code = p_coupon_code
      AND c.is_active = TRUE
      AND CURDATE() BETWEEN c.valid_from AND c.valid_to
      AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
    LIMIT 1;
    
    -- Calculate discount if coupon found and min amount met
    IF discount_type IS NOT NULL AND p_order_amount >= min_amount THEN
        IF discount_type = 'percentage' THEN
            SET discount_amt = (p_order_amount * discount_value / 100);
            IF max_discount IS NOT NULL AND discount_amt > max_discount THEN
                SET discount_amt = max_discount;
            END IF;
        ELSEIF discount_type = 'fixed' THEN
            SET discount_amt = discount_value;
        END IF;
    END IF;
    
    RETURN discount_amt;
END$$

DELIMITER ;

-- -------------------------
-- 5) FUNCTION: Check Product Stock Status
-- -------------------------
DELIMITER $$

DROP FUNCTION IF EXISTS fn_stock_status$$
CREATE FUNCTION fn_stock_status(p_product_id INT)
RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE current_stock DECIMAL(10,2);
    DECLARE status_text VARCHAR(20);
    
    SELECT quantity INTO current_stock
    FROM products
    WHERE product_id = p_product_id;
    
    IF current_stock IS NULL THEN
        SET status_text = 'Not Found';
    ELSEIF current_stock = 0 THEN
        SET status_text = 'Out of Stock';
    ELSEIF current_stock < 10 THEN
        SET status_text = 'Low Stock';
    ELSEIF current_stock < 50 THEN
        SET status_text = 'Medium Stock';
    ELSE
        SET status_text = 'In Stock';
    END IF;
    
    RETURN status_text;
END$$

DELIMITER ;

-- -------------------------
-- 6) FUNCTION: Calculate Farmer Commission
-- -------------------------
DELIMITER $$

DROP FUNCTION IF EXISTS fn_farmer_commission$$
CREATE FUNCTION fn_farmer_commission(
    p_farmer_id INT,
    p_order_id INT
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE commission_amt DECIMAL(10,2);
    DECLARE commission_rate DECIMAL(5,2) DEFAULT 10.00; -- 10% default
    
    -- Calculate commission on farmer's items in order
    SELECT SUM(oi.total_price * commission_rate / 100)
    INTO commission_amt
    FROM order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.farmer_id = p_farmer_id;
    
    RETURN IFNULL(commission_amt, 0.00);
END$$

DELIMITER ;

-- -------------------------
-- 7) FUNCTION: Get Days Since Last Order
-- -------------------------
DELIMITER $$

DROP FUNCTION IF EXISTS fn_days_since_last_order$$
CREATE FUNCTION fn_days_since_last_order(p_user_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE days_count INT;
    
    SELECT DATEDIFF(CURDATE(), MAX(order_date))
    INTO days_count
    FROM orders
    WHERE user_id = p_user_id;
    
    RETURN IFNULL(days_count, 9999);
END$$

DELIMITER ;

-- -------------------------
-- 8) FUNCTION: Calculate Product Profit Margin
-- -------------------------
DELIMITER $$

DROP FUNCTION IF EXISTS fn_product_profit_margin$$
CREATE FUNCTION fn_product_profit_margin(
    p_product_id INT,
    p_cost_price DECIMAL(10,2)
)
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE selling_price DECIMAL(10,2);
    DECLARE profit_margin DECIMAL(5,2);
    
    SELECT price INTO selling_price
    FROM products
    WHERE product_id = p_product_id;
    
    IF selling_price IS NULL OR p_cost_price = 0 THEN
        RETURN 0.00;
    END IF;
    
    SET profit_margin = ((selling_price - p_cost_price) / selling_price) * 100;
    
    RETURN ROUND(profit_margin, 2);
END$$

DELIMITER ;

-- ========================================
-- FUNCTION INVOCATION EXAMPLES
-- ========================================

SELECT '========================================' as Info;
SELECT 'FUNCTIONS CREATED SUCCESSFULLY!' as Status;
SELECT '========================================' as Info;

-- Test Function 1: Carbon Footprint
SELECT '=== FUNCTION 1: Carbon Footprint ===' as test;
SELECT o.order_id, o.order_number,
       fn_order_carbon_footprint(o.order_id) as carbon_kg
FROM orders o
LIMIT 3;

-- Test Function 2: Product Rating
SELECT '=== FUNCTION 2: Product Average Rating ===' as test;
SELECT p.product_id, p.product_name,
       fn_product_avg_rating(p.product_id) as calculated_rating,
       p.avg_rating as stored_rating
FROM products p
WHERE p.review_count > 0
LIMIT 5;

-- Test Function 3: User Loyalty
SELECT '=== FUNCTION 3: User Loyalty Level ===' as test;
SELECT u.user_id, u.name,
       fn_user_loyalty_level(u.user_id) as loyalty_level,
       COUNT(o.order_id) as total_orders,
       COALESCE(SUM(o.final_amount), 0) as total_spent
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE u.role = 'user'
GROUP BY u.user_id;

-- Test Function 4: Discount Calculation
SELECT '=== FUNCTION 4: Discount Calculation ===' as test;
SELECT 'FIRST50' as coupon_code, 500.00 as order_amount,
       fn_calculate_discount(500.00, 'FIRST50') as discount_amount
UNION ALL
SELECT 'FRESH20', 800.00,
       fn_calculate_discount(800.00, 'FRESH20')
UNION ALL
SELECT 'WELCOME100', 1000.00,
       fn_calculate_discount(1000.00, 'WELCOME100');

-- Test Function 5: Stock Status
SELECT '=== FUNCTION 5: Stock Status ===' as test;
SELECT p.product_id, p.product_name, p.quantity,
       fn_stock_status(p.product_id) as stock_status
FROM products p
ORDER BY p.quantity ASC
LIMIT 10;

-- Test Function 6: Farmer Commission
SELECT '=== FUNCTION 6: Farmer Commission ===' as test;
SELECT DISTINCT oi.farmer_id, u.name as farmer_name,
       fn_farmer_commission(oi.farmer_id, 1) as commission_amount,
       SUM(oi.total_price) as total_sales
FROM order_items oi
JOIN users u ON oi.farmer_id = u.user_id
WHERE oi.order_id = 1
GROUP BY oi.farmer_id;

-- Test Function 7: Days Since Last Order
SELECT '=== FUNCTION 7: Days Since Last Order ===' as test;
SELECT u.user_id, u.name,
       fn_days_since_last_order(u.user_id) as days_inactive,
       MAX(o.order_date) as last_order_date
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE u.role = 'user'
GROUP BY u.user_id;

-- Test Function 8: Profit Margin
SELECT '=== FUNCTION 8: Product Profit Margin ===' as test;
SELECT p.product_id, p.product_name, p.price as selling_price,
       (p.price * 0.7) as assumed_cost_price,
       fn_product_profit_margin(p.product_id, p.price * 0.7) as profit_margin_percent
FROM products p
LIMIT 5;

-- List all functions
SELECT '========================================' as Info;
SELECT 'ALL FUNCTIONS IN DATABASE:' as Info;
SHOW FUNCTION STATUS WHERE Db = 'green_market';

SELECT '========================================' as Info;
SELECT '✅ ALL 8 FUNCTIONS CREATED AND TESTED!' as Status;
SELECT '========================================' as Info;
