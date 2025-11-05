# 🌱 GREEN MARKET DATABASE - COMPLETE DEMO GUIDE

## 📚 TABLE OF CONTENTS
1. [Database Overview](#database-overview)
2. [Tables Structure](#tables-structure)
3. [Triggers Explained](#triggers-explained)
4. [Stored Procedures](#stored-procedures)
5. [Views](#views)
6. [Backend Connection](#backend-connection)
7. [Frontend Integration](#frontend-integration)
8. [Data Flow Examples](#data-flow-examples)
9. [Demo Scenarios](#demo-scenarios)

---

## 🎯 DATABASE OVERVIEW

**Database Name:** `green_market`
**Purpose:** E-commerce platform connecting farmers directly with customers
**Key Features:**
- Multi-role user system (Admin, Farmer, Customer)
- Product catalog with categories
- Order management with tracking
- Review and rating system
- Real-time notifications
- Wishlist functionality
- Coupon system

---

## 📊 TABLES STRUCTURE

### 1️⃣ **USERS TABLE** (`users`)
**Purpose:** Stores all user information

| Column | Type | Description |
|--------|------|-------------|
| user_id | INT (PK) | Unique user identifier |
| name | VARCHAR(100) | User's full name |
| email | VARCHAR(100) | Unique email (used for login) |
| password | VARCHAR(255) | Bcrypt hashed password |
| phone | VARCHAR(20) | Contact number |
| address | TEXT | Delivery/farm address |
| role | ENUM | 'user', 'farmer', 'admin' |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Registration date |
| last_login | TIMESTAMP | Last login time |

**Sample Users:**
- **Admin:** admin@greenmarket.com (Manages platform)
- **Farmers:** alice@gmail.com, charlie@gmail.com, emma@gmail.com (Sell products)
- **Customers:** bob@gmail.com, david@gmail.com (Buy products)
- **Password:** pass123 (for all test users)

---

### 2️⃣ **CATEGORIES TABLE** (`categories`)
**Purpose:** Product classification

| Column | Type | Description |
|--------|------|-------------|
| category_id | INT (PK) | Unique category ID |
| category_name | VARCHAR(100) | Category name (Vegetables, Fruits, etc.) |
| description | TEXT | Category description |
| image_url | VARCHAR(500) | Category image |
| display_order | INT | Sorting order |

**8 Categories:**
1. Vegetables (Tomatoes, Carrots, etc.)
2. Fruits (Apples, Mangoes, etc.)
3. Dairy (Milk, Paneer, Ghee)
4. Grains (Rice, Wheat)
5. Spices (Turmeric, Chili Powder)
6. Oils (Mustard, Coconut)
7. Pulses (Toor Dal, Moong Dal)
8. Eggs & Meat

---

### 3️⃣ **PRODUCTS TABLE** (`products`)
**Purpose:** Store all products listed by farmers

| Column | Type | Description |
|--------|------|-------------|
| product_id | INT (PK) | Unique product ID |
| farmer_id | INT (FK) | Links to users table |
| product_name | VARCHAR(100) | Product name |
| category_id | INT (FK) | Links to categories |
| description | TEXT | Product details |
| price | DECIMAL(10,2) | Price per unit |
| quantity | DECIMAL(10,2) | Available stock |
| image_url | VARCHAR(500) | Product image |
| unit | VARCHAR(50) | kg, liter, dozen, piece |
| is_active | BOOLEAN | Product availability |
| avg_rating | DECIMAL(3,2) | Average rating (0-5) |
| review_count | INT | Total reviews |
| total_sold | DECIMAL(10,2) | Total quantity sold |

**33 Products** distributed across 3 farmers with real images and descriptions

---

### 4️⃣ **ORDERS TABLE** (`orders`)
**Purpose:** Store customer orders

| Column | Type | Description |
|--------|------|-------------|
| order_id | INT (PK) | Unique order ID |
| order_number | VARCHAR(50) | Display ID (GM2025001) |
| user_id | INT (FK) | Customer who placed order |
| total_amount | DECIMAL | Products total |
| delivery_charge | DECIMAL | Shipping cost |
| discount | DECIMAL | Coupon discount |
| final_amount | DECIMAL | Total to pay |
| status | ENUM | pending, confirmed, packed, shipped, delivered, etc. |
| payment_status | ENUM | pending, paid, failed, refunded |
| payment_method | ENUM | cod, online, upi, card |
| delivery_address | TEXT | Shipping address |
| tracking_id | VARCHAR | Tracking number |
| expected_delivery_date | DATE | ETA |

**Order Flow:**
1. Customer adds products to cart
2. Goes to checkout
3. Order created with status='pending'
4. Farmer confirms → status='confirmed'
5. Packed → status='packed'
6. Shipped → status='shipped'
7. Out for delivery → status='out-for-delivery'
8. Delivered → status='delivered'

---

### 5️⃣ **ORDER_ITEMS TABLE** (`order_items`)
**Purpose:** Individual products in each order

| Column | Type | Description |
|--------|------|-------------|
| order_item_id | INT (PK) | Unique item ID |
| order_id | INT (FK) | Links to orders |
| product_id | INT (FK) | Which product |
| quantity | DECIMAL | How many units |
| price | DECIMAL | Price at time of order |
| total_price | DECIMAL | quantity × price |
| farmer_id | INT (FK) | Which farmer gets paid |

**Why separate table?**
- One order can have multiple products
- Each product may be from different farmers
- Track individual item prices (price might change later)

---

### 6️⃣ **ORDER_TRACKING TABLE** (`order_tracking`)
**Purpose:** Track order journey step by step

| Column | Type | Description |
|--------|------|-------------|
| tracking_id | INT (PK) | Unique tracking event |
| order_id | INT (FK) | Which order |
| status | VARCHAR | Status name |
| location | VARCHAR | Current location |
| description | TEXT | Status details |
| created_at | TIMESTAMP | When this happened |

**Example tracking:**
```
Order #GM2025001
├── Order Placed (10:30 AM)
├── Confirmed (10:45 AM)
├── Packed (2:00 PM)
├── Shipped (4:00 PM, Patna Distribution Center)
├── Out for Delivery (9:00 AM next day, Boring Road)
└── Delivered (11:30 AM, 123 Main Street)
```

---

### 7️⃣ **REVIEWS TABLE** (`reviews`)
**Purpose:** Customer feedback on products

| Column | Type | Description |
|--------|------|-------------|
| review_id | INT (PK) | Unique review ID |
| product_id | INT (FK) | Product being reviewed |
| user_id | INT (FK) | Customer who reviewed |
| rating | TINYINT | 1 to 5 stars |
| comment | TEXT | Review text |
| is_verified_purchase | BOOLEAN | Did they actually buy it? |
| helpful_count | INT | How many found helpful |

**Constraint:** One user can review a product only once
**Effect:** Updates product's avg_rating and review_count automatically

---

### 8️⃣ **WISHLIST TABLE** (`wishlist`)
**Purpose:** Save products for later

| Column | Type | Description |
|--------|------|-------------|
| wishlist_id | INT (PK) | Unique entry |
| user_id | INT (FK) | Whose wishlist |
| product_id | INT (FK) | Which product |
| added_at | TIMESTAMP | When added |

**Constraint:** Can't add same product twice

---

### 9️⃣ **NOTIFICATIONS TABLE** (`notifications`)
**Purpose:** Alert users about events

| Column | Type | Description |
|--------|------|-------------|
| notification_id | INT (PK) | Unique notification |
| user_id | INT (FK) | Who receives it |
| title | VARCHAR | Notification heading |
| message | TEXT | Full message |
| type | ENUM | order, product, review, account, promotion |
| is_read | BOOLEAN | Read status |
| link | VARCHAR | Where to go when clicked |

**Examples:**
- "Your order #GM2025001 has been delivered"
- "Low stock alert for Organic Tomatoes"
- "New review on your product"

---

### 🔟 **COUPONS TABLE** (`coupons`)
**Purpose:** Discount codes

| Column | Type | Description |
|--------|------|-------------|
| code | VARCHAR(50) | Coupon code (FIRST50) |
| discount_type | ENUM | percentage or fixed |
| discount_value | DECIMAL | Amount/percentage |
| min_order_amount | DECIMAL | Minimum cart value |
| max_discount | DECIMAL | Max discount cap |
| valid_from | DATE | Start date |
| valid_to | DATE | End date |
| usage_limit | INT | How many times usable |

**Sample Coupons:**
- `FIRST50`: ₹50 off on orders above ₹200
- `FRESH20`: 20% off on orders above ₹300
- `WELCOME100`: ₹100 off on orders above ₹500

---

## ⚡ TRIGGERS EXPLAINED

### What are Triggers?
**Automatic actions** that run when something happens in the database (INSERT, UPDATE, DELETE)

### 1️⃣ **Review Rating Update Trigger**

```sql
trg_review_after_insert
```

**When it runs:** After a new review is added
**What it does:**
1. Counts total reviews for that product
2. Calculates average rating
3. Updates the product table

**Example Flow:**
```
Customer submits review: ⭐⭐⭐⭐⭐ (5 stars)
    ↓
Trigger automatically runs
    ↓
Product's avg_rating updated: 4.5 → 4.6
Product's review_count updated: 10 → 11
```

**Similarly:**
- `trg_review_after_update`: When review is edited
- `trg_review_after_delete`: When review is removed

---

### 2️⃣ **Order Number Generator Trigger**

```sql
trg_order_before_insert
```

**When it runs:** Before new order is created
**What it does:** Generates unique order number like `GM20250001234`

**Format:**
- GM = Green Market
- 2025 = Year
- 001234 = Random 6-digit number

---

### 3️⃣ **Product Sold Counter Trigger**

```sql
trg_update_product_sold
```

**When it runs:** When order status changes to 'delivered'
**What it does:** Updates product's `total_sold` field

**Example:**
```
Order delivered with:
  - 2 kg Tomatoes
  - 1 kg Carrots
    ↓
Trigger updates:
  - Tomatoes: total_sold = 150 → 152
  - Carrots: total_sold = 35 → 36
```

---

### 4️⃣ **Stock Reduction Trigger**

```sql
trg_reduce_stock
```

**When it runs:** When order item is created
**What it does:** Reduces product quantity

**Example:**
```
Customer orders 2 kg Tomatoes (stock = 150 kg)
    ↓
Trigger runs immediately
    ↓
Stock updated: 150 → 148 kg
```

**Why important?** Prevents overselling!

---

## 🔧 STORED PROCEDURES

### What are Stored Procedures?
**Pre-written SQL scripts** that can be called from backend with parameters

### 1️⃣ **Get Farmer Products**

```sql
CALL sp_get_farmer_products(2);
```

**What it does:**
- Gets all products for farmer ID 2 (Alice)
- Includes category name, ratings, reviews
- Sorted by newest first

**Used by:** Farmer Dashboard

---

### 2️⃣ **Get Order Details**

```sql
CALL sp_get_order_details(1);
```

**What it returns:**
1. **Order Info:** Order number, customer name, address, total
2. **Order Items:** All products in order with farmer details
3. **Tracking History:** Complete timeline

**Used by:** Order Tracking Page

---

### 3️⃣ **Farmer Dashboard Stats**

```sql
CALL sp_farmer_dashboard_stats(2);
```

**Returns 4 result sets:**
1. Total products listed
2. Total sales amount (₹)
3. Active orders count
4. Low stock products

**Used by:** Farmer Dashboard Statistics Cards

---

## 👁️ VIEWS

### What are Views?
**Virtual tables** with pre-written complex queries

### 1️⃣ **Popular Products View**

```sql
SELECT * FROM vw_popular_products LIMIT 10;
```

**Shows:** Top 20 products by:
- Total sold
- Average rating
- With farmer name, category

**Used by:** Home page featured products

---

### 2️⃣ **Farmer Statistics View**

```sql
SELECT * FROM vw_farmer_stats;
```

**Shows for each farmer:**
- Total products
- Total items sold
- Average rating
- Total orders received

**Used by:** Admin dashboard, farmer leaderboard

---

### 3️⃣ **Top Customers View**

```sql
SELECT * FROM vw_top_customers;
```

**Shows:** Top 10 customers by spending
**Used by:** Admin analytics

---

## 🔌 BACKEND CONNECTION

### How Backend Connects to Database

**File:** `backend/config/database.js`

```javascript
const mysql = require('mysql2');

// Create connection pool (efficient for multiple requests)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',  // from .env file
  database: 'green_market',
  port: 3306,
  connectionLimit: 10  // Max 10 simultaneous connections
});

// Export promise version for async/await
const promisePool = pool.promise();
module.exports.promise = promisePool;
```

### Example API Endpoint

**File:** `backend/routes/products.js`

```javascript
// Get all products
router.get('/', async (req, res) => {
  try {
    const db = require('../config/database').promise;
    
    // Query database
    const [products] = await db.query(`
      SELECT p.*, c.category_name, u.name as farmer_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN users u ON p.farmer_id = u.user_id
      WHERE p.is_active = TRUE
      ORDER BY p.created_at DESC
    `);
    
    // Send to frontend
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});
```

### Authentication Middleware

**File:** `backend/middleware/auth.js`

```javascript
// Verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;  // Attach user info to request
    next();
  });
};
```

---

## 🎨 FRONTEND INTEGRATION

### How Frontend Gets Data

**File:** `frontend/src/services/api.js`

```javascript
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
};

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getUserOrders: (userId) => api.get(`/orders/user/${userId}`),
};
```

### Example Component Usage

**File:** `frontend/src/pages/Products.js`

```javascript
import { productsAPI } from '../services/api';

function Products() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);  // Updates UI
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.product_id} product={product} />
      ))}
    </div>
  );
}
```

---

## 🔄 DATA FLOW EXAMPLES

### Example 1: Customer Places Order

```
1. FRONTEND (Cart.js)
   └─> User clicks "Proceed to Checkout"
   └─> Navigates to Checkout.js

2. FRONTEND (Checkout.js)
   └─> User fills delivery address
   └─> Clicks "Place Order"
   └─> Calls: ordersAPI.create(orderData)

3. BACKEND (orders.js route)
   └─> POST /api/orders
   └─> Validates user authentication (JWT)
   └─> Validates stock availability
   
4. DATABASE
   └─> INSERT INTO orders (...)
   └─> trg_order_before_insert runs → generates order_number
   
   └─> INSERT INTO order_items (...)
   └─> trg_reduce_stock runs → updates product.quantity
   
   └─> INSERT INTO order_tracking (...)
   └─> Creates first tracking entry: "Order Placed"

5. BACKEND
   └─> Returns order_id and order_number

6. FRONTEND
   └─> Redirects to /order-tracking/:orderId
   └─> Shows order confirmation
   └─> Cart cleared from localStorage
```

---

### Example 2: Farmer Updates Order Status

```
1. FRONTEND (FarmerDashboard.js)
   └─> Farmer views Orders tab
   └─> Calls: ordersAPI.getFarmerOrders()

2. BACKEND (farmerRoutes.js)
   └─> GET /api/farmer/orders
   └─> Verifies farmer authentication
   
3. DATABASE
   └─> Query:
       SELECT o.*, u.name as customer_name
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       WHERE oi.farmer_id = ? AND o.status != 'delivered'

4. FRONTEND
   └─> Displays orders with dropdown
   └─> Farmer selects "Shipped" status
   └─> Calls: ordersAPI.updateStatus(orderId, 'shipped')

5. BACKEND (farmerRoutes.js)
   └─> PUT /api/farmer/orders/:orderId/status
   └─> Validates farmer owns items in order
   
6. DATABASE
   └─> UPDATE orders SET status = 'shipped'
   └─> trg_update_product_sold checks if delivered
   └─> INSERT INTO order_tracking (new status)

7. SOCKET.IO (Real-time)
   └─> Broadcasts to customer's browser
   └─> Customer sees live update notification

8. FRONTEND (Customer's OrderTracking page)
   └─> Automatically updates timeline
   └─> Shows "📦 Shipped" with timestamp
```

---

### Example 3: Customer Adds Review

```
1. FRONTEND (ProductDetail.js)
   └─> Customer gives 5 stars + comment
   └─> Calls: reviewsAPI.add({ productId, rating, comment })

2. BACKEND (reviews.js)
   └─> POST /api/reviews
   └─> Verifies user is logged in
   └─> Checks if already reviewed (one per user)

3. DATABASE
   └─> INSERT INTO reviews (...)
   └─> trg_review_after_insert runs
   
   └─> Trigger calculates:
       AVG(rating) from all reviews of this product
       COUNT(*) total reviews
   
   └─> UPDATE products SET
       avg_rating = 4.6,
       review_count = 11

4. BACKEND
   └─> Creates notification for farmer
   └─> INSERT INTO notifications (...)

5. FRONTEND
   └─> Product page refreshes
   └─> Shows updated rating: ⭐⭐⭐⭐⭐ (4.6/5 · 11 reviews)
   
   └─> Farmer's navbar shows notification bell
   └─> "New review on your product"
```

---

## 🎬 DEMO SCENARIOS

### Scenario 1: New Customer Registration

**What to Show:**
1. Open Register page
2. Fill form with role='user'
3. Submit

**Behind the Scenes:**
```sql
-- Backend hashes password with bcrypt
const hashedPassword = await bcrypt.hash('pass123', 10);

-- Inserts into database
INSERT INTO users (name, email, password, role) 
VALUES ('John Doe', 'john@example.com', hashedPassword, 'user');

-- Returns user data + JWT token
token = jwt.sign({ userId: 5, role: 'user' }, SECRET);
```

**Show in Database:**
```sql
SELECT * FROM users WHERE email = 'john@example.com';
```

---

### Scenario 2: Browse Products with Filters

**What to Show:**
1. Open Products page
2. Select "Vegetables" category
3. Sort by "Price: Low to High"

**Behind the Scenes:**
```sql
-- Frontend sends: GET /api/products?category=Vegetables&sortBy=price

-- Backend builds dynamic query:
SELECT p.*, c.category_name, u.name as farmer_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN users u ON p.farmer_id = u.user_id
WHERE p.is_active = TRUE
  AND c.category_name = 'Vegetables'
ORDER BY p.price ASC;
```

**Show in Database:**
```sql
-- Show products table with different prices
SELECT product_name, price, quantity, farmer_id 
FROM products 
WHERE category_id = 1 
ORDER BY price;
```

---

### Scenario 3: Place Order & Track

**What to Show:**
1. Add 2 products to cart
2. Go to checkout
3. Place order with COD
4. View tracking page

**Show Database Changes:**

**Before Order:**
```sql
SELECT quantity FROM products WHERE product_id = 1;
-- Result: 150
```

**After Order:**
```sql
-- Orders table
SELECT * FROM orders WHERE order_number = 'GM20250001234';

-- Order items
SELECT * FROM order_items WHERE order_id = 5;

-- Updated stock
SELECT quantity FROM products WHERE product_id = 1;
-- Result: 148 (reduced by 2)

-- Tracking
SELECT status, description, created_at 
FROM order_tracking 
WHERE order_id = 5 
ORDER BY created_at;
```

---

### Scenario 4: Farmer Dashboard

**What to Show:**
1. Login as farmer (alice@gmail.com)
2. View dashboard statistics
3. See orders received
4. Update order status

**Show Stored Procedure:**
```sql
CALL sp_farmer_dashboard_stats(2);
-- Returns:
-- Result Set 1: total_products = 15
-- Result Set 2: total_sales = ₹5,420
-- Result Set 3: active_orders = 3
-- Result Set 4: low_stock_products = 2
```

**Show Orders Query:**
```sql
SELECT o.order_number, o.final_amount, o.status,
       u.name as customer_name, u.phone
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN users u ON o.user_id = u.user_id
WHERE oi.farmer_id = 2;
```

---

### Scenario 5: Trigger Demonstration

**Show Review Trigger:**

**Before:**
```sql
SELECT avg_rating, review_count FROM products WHERE product_id = 1;
-- Result: 4.50, 10
```

**Add Review:**
```sql
INSERT INTO reviews (product_id, user_id, rating, comment)
VALUES (1, 5, 5, 'Excellent tomatoes!');
```

**After (Automatic):**
```sql
SELECT avg_rating, review_count FROM products WHERE product_id = 1;
-- Result: 4.54, 11 (Updated by trigger!)
```

**Show Trigger Code:**
```sql
SHOW CREATE TRIGGER trg_review_after_insert;
```

---

### Scenario 6: Popular Products View

**Show View Usage:**
```sql
-- Simple query using complex logic behind scenes
SELECT product_name, farmer_name, category_name, 
       avg_rating, total_sold 
FROM vw_popular_products 
LIMIT 5;

-- Returns pre-calculated popular products
```

**Show Underlying Query:**
```sql
SHOW CREATE VIEW vw_popular_products;
```

---

## 📝 KEY POINTS FOR DEMO

### 1. **Database Design Benefits**
- ✅ Normalized structure (no data redundancy)
- ✅ Foreign keys ensure data integrity
- ✅ Indexes for fast queries
- ✅ Triggers for automatic updates
- ✅ Views for simplified complex queries

### 2. **Security Features**
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens for authentication
- ✅ Role-based access control
- ✅ SQL injection prevention (prepared statements)

### 3. **Performance Optimizations**
- ✅ Connection pooling (10 connections)
- ✅ Indexes on frequently queried columns
- ✅ Views for expensive queries
- ✅ Efficient stored procedures

### 4. **Real-time Features**
- ✅ Order tracking updates
- ✅ Notification system
- ✅ Socket.IO for live updates
- ✅ Stock management

### 5. **Business Logic**
- ✅ Automatic order number generation
- ✅ Stock reduction on order
- ✅ Rating calculations
- ✅ Sales tracking
- ✅ Coupon validation

---

## 🎓 DEMO SCRIPT SUGGESTION

### Opening (2 minutes)
"Green Market is a farm-to-customer e-commerce platform built on MySQL database with 13 tables, 5 triggers, 3 stored procedures, and 3 views. Let me show you how it all works together..."

### Database Structure (3 minutes)
"The core tables are Users, Products, Orders, and Reviews. Users have roles - customers buy, farmers sell, admins manage. Every interaction flows through these tables..."

### Triggers Demo (3 minutes)
"Watch what happens when I add a review... the trigger automatically updates the product rating. This happens instantly without any backend code!"

### Order Flow (4 minutes)
"When a customer places an order, see how the database handles it: creates order, reduces stock, generates tracking - all through triggers and foreign keys..."

### Backend Connection (2 minutes)
"The Node.js backend connects through this connection pool. Every API endpoint queries the database using async/await for efficiency..."

### Real-time Updates (2 minutes)
"When farmer updates order status, Socket.IO broadcasts to customer's browser, and they see the live update immediately..."

### Analytics (2 minutes)
"These views and stored procedures give us instant analytics - top products, farmer stats, customer spending - all pre-calculated..."

### Closing (2 minutes)
"This architecture ensures data consistency, security, and performance. The database handles business logic through triggers, keeping application code clean..."

---

## 🎯 COMMON DEMO QUESTIONS & ANSWERS

**Q: Why use triggers instead of application code?**
A: Triggers ensure data consistency regardless of which application accesses the database. If we later add a mobile app, the same logic applies automatically.

**Q: How do you prevent SQL injection?**
A: We use prepared statements with parameter binding. MySQL2 library automatically escapes values.

**Q: What if two customers order the last item simultaneously?**
A: The stock reduction trigger uses row-level locking. Second customer gets "out of stock" error.

**Q: Why separate order_items table?**
A: One order can have multiple products from different farmers. This structure allows proper tracking and payment distribution.

**Q: How do you handle farmer payment?**
A: Each order_item stores farmer_id. When order is delivered, we can calculate payment per farmer from total_price.

**Q: Can you scale this database?**
A: Yes! We can add read replicas for queries, use Redis for caching, implement database sharding by region.

---

## 🚀 FINAL CHECKLIST

Before Demo:
- [ ] MySQL server running
- [ ] Database populated with sample data
- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] Test all user roles (admin, farmer, customer)
- [ ] Have MySQL Workbench open to show queries
- [ ] Prepare backup database in case of issues

Good Luck! 🎉
