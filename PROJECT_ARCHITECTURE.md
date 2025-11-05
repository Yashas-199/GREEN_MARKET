# Green Market - Full Stack Architecture Explanation

## 🎯 Project Overview
Green Market is a full-stack e-commerce platform connecting farmers directly with customers. It uses:
- **Frontend**: React.js (runs on port 3000)
- **Backend**: Node.js + Express.js (runs on port 5000)
- **Database**: MySQL (runs on port 3306)

---

## 📊 How Frontend, Backend, and SQL Connect

### The Complete Flow: UI → Backend → SQL → Backend → UI

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   FRONTEND  │  HTTP   │   BACKEND   │   SQL   │   DATABASE  │
│  (React)    │ ──────> │  (Express)  │ ──────> │   (MySQL)   │
│  Port 3000  │ Request │  Port 5000  │  Query  │  Port 3306  │
│             │ <────── │             │ <────── │             │
│             │ Response│             │  Result │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

### Step-by-Step Example: Adding a Product

#### **Step 1: User Interaction (Frontend)**
**File**: `frontend/src/pages/FarmerDashboard.js`

When farmer clicks "Add Product" and fills the form:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Data from form inputs
  const productData = {
    farmer_id: 2,              // From localStorage (logged-in user)
    product_name: "Tomatoes",  // From input field
    category_id: 1,            // From dropdown (Vegetables)
    description: "Fresh...",   // From textarea
    price: 50,                 // From number input
    quantity: 10,              // From number input
    unit: "kg",                // From select dropdown
    image_url: "https://..."   // From text input
  };

  // Send HTTP POST request to backend
  await axios.post(
    'http://localhost:5000/api/products',  // Backend endpoint
    productData,                            // JSON data
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
```

**What happens**: React sends an HTTP POST request with product data as JSON to the backend server.

---

#### **Step 2: Backend Receives Request (Express.js)**
**File**: `backend/server.js`

```javascript
// Server listening for requests
app.use('/api/products', productRoutes);  // Routes all /api/products requests
```

The request arrives at backend on port 5000 and is routed to products.js

---

#### **Step 3: Route Handler Processes Request**
**File**: `backend/routes/products.js`

```javascript
// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    // Extract data from request body
    const { farmer_id, product_name, category_id, description, 
            price, quantity, unit, image_url } = req.body;

    // Validate required fields
    if (!farmer_id || !product_name || !category_id || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Execute SQL INSERT query
    const [result] = await db.query(`
      INSERT INTO products 
        (farmer_id, product_name, category_id, description, price, 
         quantity, image_url, unit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [farmer_id, product_name, category_id, description, 
        parseFloat(price), parseFloat(quantity), image_url, unit]);

    // Send success response back to frontend
    res.status(201).json({ 
      message: 'Product added successfully',
      product_id: result.insertId  // Auto-generated ID from MySQL
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});
```

**What happens**: 
1. Backend extracts data from HTTP request
2. Validates the data
3. Creates SQL query with placeholders (?)
4. Executes query against MySQL database
5. Sends response back to frontend

---

#### **Step 4: SQL Connection & Query Execution**
**File**: `backend/config/database.js`

```javascript
const mysql = require('mysql2');

// Create connection pool to MySQL
const pool = mysql.createPool({
  host: 'localhost',      // Where MySQL is running
  user: 'root',          // MySQL username
  password: '',          // MySQL password (from .env)
  database: 'green_market',  // Database name
  port: 3306,            // MySQL default port
  connectionLimit: 10    // Max simultaneous connections
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    connection.release();  // Return connection to pool
  }
});

// Export promise-based pool for async/await
const promisePool = pool.promise();
module.exports = pool;
module.exports.promise = promisePool;
```

**What happens**: 
- Creates a connection pool (reusable connections to MySQL)
- When `db.query()` is called, it:
  1. Gets available connection from pool
  2. Sends SQL query to MySQL server
  3. Receives result from MySQL
  4. Returns connection to pool
  5. Returns result to route handler

---

#### **Step 5: MySQL Database Processes Query**
**Database**: `green_market` on MySQL server

The SQL INSERT query is executed:
```sql
INSERT INTO products 
  (farmer_id, product_name, category_id, description, price, 
   quantity, image_url, unit, is_active)
VALUES (2, 'Tomatoes', 1, 'Fresh organic tomatoes', 50.00, 
        10.00, 'https://...', 'kg', TRUE);
```

**What happens in MySQL**:
1. Validates data types (INT, VARCHAR, DECIMAL, etc.)
2. Checks foreign key constraints (farmer_id must exist in users table)
3. Auto-generates product_id (AUTO_INCREMENT primary key)
4. Inserts row into products table
5. Returns result with insertId

**Database Schema**:
```sql
CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,  -- Auto-generated ID
  farmer_id INT NOT NULL,                     -- Foreign key to users
  product_name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,                   -- Foreign key to categories
  description TEXT,
  price DECIMAL(10,2) NOT NULL,              -- Max 99999999.99
  quantity DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  unit VARCHAR(50) DEFAULT 'kg',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(user_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
```

---

#### **Step 6: Backend Sends Response**
The backend receives the SQL result and sends HTTP response:
```javascript
res.status(201).json({ 
  message: 'Product added successfully',
  product_id: 34  // The auto-generated ID from MySQL
});
```

---

#### **Step 7: Frontend Receives Response**
**File**: `frontend/src/pages/FarmerDashboard.js`

```javascript
try {
  await axios.post('http://localhost:5000/api/products', productData);
  
  // Success! Update UI
  setMessage({ type: 'success', text: 'Product added successfully!' });
  setShowModal(false);  // Close the form modal
  fetchData();          // Reload products from database
} catch (error) {
  // Error! Show error message
  setMessage({ type: 'error', text: 'Failed to save product' });
}
```

**What happens**: 
1. Frontend receives success/error response
2. Shows success/error message to user
3. Closes the form
4. Fetches updated product list from database
5. Re-renders the UI with new product

---

## 🔄 Complete CRUD Operations Explained

### 1. **CREATE (Add Product)** - Already explained above

### 2. **READ (Display Products)**

#### Frontend Requests Data:
```javascript
// frontend/src/pages/FarmerDashboard.js
const fetchData = async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // GET request to backend
  const productsRes = await axios.get(
    `http://localhost:5000/api/products/farmer/${user.user_id}`
  );
  
  setProducts(productsRes.data);  // Update state with products
};
```

#### Backend Executes SELECT Query:
```javascript
// backend/routes/products.js
router.get('/farmer/:farmerId', async (req, res) => {
  const { farmerId } = req.params;
  
  // SQL JOIN query to get product with category name
  const [products] = await db.query(`
    SELECT p.*, c.category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE p.farmer_id = ?
    ORDER BY p.created_at DESC
  `, [farmerId]);
  
  res.json(products);  // Send array of products
});
```

#### SQL Execution:
```sql
SELECT p.*, c.category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
WHERE p.farmer_id = 2
ORDER BY p.created_at DESC;
```

**Result from MySQL**:
```json
[
  {
    "product_id": 34,
    "farmer_id": 2,
    "product_name": "Tomatoes",
    "category_id": 1,
    "category_name": "Vegetables",
    "price": 50.00,
    "quantity": 10.00,
    "unit": "kg",
    "image_url": "https://...",
    "created_at": "2025-11-04T12:30:00.000Z"
  },
  // ... more products
]
```

#### Frontend Displays Data:
```javascript
// React renders the products
{products.map(product => (
  <div key={product.product_id}>
    <img src={product.image_url} alt={product.product_name} />
    <h3>{product.product_name}</h3>
    <p>Category: {product.category_name}</p>
    <p>Price: ₹{product.price}/{product.unit}</p>
    <p>Stock: {product.quantity}</p>
  </div>
))}
```

---

### 3. **UPDATE (Edit Product)**

#### Frontend Sends Update:
```javascript
// When farmer clicks "Edit" button
const handleEdit = (product) => {
  setEditingProduct(product);  // Store product being edited
  setFormData({
    product_name: product.product_name,
    category_id: product.category_id,
    price: product.price,
    // ... other fields
  });
  setShowModal(true);  // Show edit form
};

// When form is submitted
const handleSubmit = async (e) => {
  await axios.put(
    `http://localhost:5000/api/products/${editingProduct.product_id}`,
    formData
  );
};
```

#### Backend Executes UPDATE Query:
```javascript
// backend/routes/products.js
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { product_name, category_id, description, price, 
          quantity, unit, image_url } = req.body;
  
  // SQL UPDATE query
  await db.query(`
    UPDATE products 
    SET product_name = ?, category_id = ?, description = ?, 
        price = ?, quantity = ?, image_url = ?, unit = ?
    WHERE product_id = ?
  `, [product_name, category_id, description, parseFloat(price), 
      parseFloat(quantity), image_url, unit, id]);
  
  res.json({ message: 'Product updated successfully' });
});
```

#### SQL Execution:
```sql
UPDATE products 
SET product_name = 'Fresh Tomatoes',
    category_id = 1,
    description = 'Premium organic tomatoes',
    price = 60.00,
    quantity = 15.00,
    image_url = 'https://...',
    unit = 'kg'
WHERE product_id = 34;
```

**What changes in database**: Only the row with product_id=34 is modified with new values.

---

### 4. **DELETE (Remove Product)**

#### Frontend Sends Delete Request:
```javascript
const handleDelete = async (productId) => {
  if (window.confirm('Delete this product?')) {
    await axios.delete(
      `http://localhost:5000/api/products/${productId}`
    );
    fetchData();  // Reload products
  }
};
```

#### Backend Executes DELETE Query:
```javascript
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // SQL DELETE query
  await db.query('DELETE FROM products WHERE product_id = ?', [id]);
  
  res.json({ message: 'Product deleted successfully' });
});
```

#### SQL Execution:
```sql
DELETE FROM products WHERE product_id = 34;
```

**What happens in database**: The entire row is permanently removed from the products table.

---

## 🔐 Authentication & Security Flow

### Login Process: How User Data is Verified

#### 1. User Enters Credentials:
```javascript
// frontend/src/pages/Login.js
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Send login credentials to backend
  const response = await axios.post(
    'http://localhost:5000/api/auth/login',
    { email: 'alice@gmail.com', password: 'pass123' }
  );
  
  // Store authentication token
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
};
```

#### 2. Backend Verifies Against Database:
```javascript
// backend/routes/auth.js
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Query user from database
  const [users] = await db.promise().query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  
  if (users.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const user = users[0];
  
  // Compare password with hashed password in database
  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ 
    token, 
    user: { 
      user_id: user.user_id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    } 
  });
});
```

#### 3. SQL Query Execution:
```sql
SELECT * FROM users WHERE email = 'alice@gmail.com';
```

**Result**:
```json
{
  "user_id": 2,
  "name": "Alice Farmer",
  "email": "alice@gmail.com",
  "password": "$2b$10$hashed_password_here",  // Encrypted with bcrypt
  "phone": "9876543210",
  "address": "Organic Farm, Patna",
  "role": "farmer",
  "is_active": true,
  "created_at": "2025-11-04T07:00:00.000Z"
}
```

#### 4. Password Verification:
```javascript
// bcrypt compares plain text password with hashed password
const isValidPassword = await bcrypt.compare(
  'pass123',                                    // User entered
  '$2b$10$hashed_password_here'               // From database
);
// Returns: true or false
```

---

## 🔗 SQL Relationships (Foreign Keys)

### How Tables Connect

```sql
-- Users Table (Parent)
CREATE TABLE users (
  user_id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  role ENUM('user', 'farmer', 'admin')
);

-- Categories Table (Parent)
CREATE TABLE categories (
  category_id INT PRIMARY KEY,
  category_name VARCHAR(100)
);

-- Products Table (Child)
CREATE TABLE products (
  product_id INT PRIMARY KEY,
  farmer_id INT,                    -- Links to users.user_id
  category_id INT,                  -- Links to categories.category_id
  product_name VARCHAR(255),
  price DECIMAL(10,2),
  
  FOREIGN KEY (farmer_id) REFERENCES users(user_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
```

### Example JOIN Query:
```sql
-- Get products with farmer names and category names
SELECT 
  p.product_id,
  p.product_name,
  p.price,
  u.name as farmer_name,           -- From users table
  c.category_name                  -- From categories table
FROM products p
LEFT JOIN users u ON p.farmer_id = u.user_id
LEFT JOIN categories c ON p.category_id = c.category_id
WHERE p.is_active = TRUE;
```

**Result**:
```
product_id | product_name | price | farmer_name   | category_name
-----------|-------------|-------|---------------|---------------
1          | Tomatoes    | 50.00 | Alice Farmer  | Vegetables
2          | Apples      | 120.00| Charlie Farm  | Fruits
3          | Milk        | 60.00 | Alice Farmer  | Dairy
```

**Why Foreign Keys Matter**:
- **Data Integrity**: Can't insert product with farmer_id that doesn't exist
- **Cascading**: If user is deleted, can automatically delete their products
- **Joins**: Efficiently combine data from related tables

---

## 🎨 Real-time UI Updates

### How Category Dropdown Gets Populated

#### 1. Component Loads:
```javascript
// frontend/src/pages/FarmerDashboard.js
useEffect(() => {
  fetchData();  // Called when component mounts
}, []);

const fetchData = async () => {
  // Fetch categories from backend
  const categoriesRes = await axios.get(
    'http://localhost:5000/api/products/categories/all'
  );
  setCategories(categoriesRes.data);  // Update state
};
```

#### 2. Backend Retrieves Categories:
```javascript
// backend/routes/products.js
router.get('/categories/all', async (req, res) => {
  const [categories] = await db.query(`
    SELECT c.*, COUNT(p.product_id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.category_id = p.category_id 
    GROUP BY c.category_id
    ORDER BY c.display_order
  `);
  res.json(categories);
});
```

#### 3. SQL Query Executes:
```sql
SELECT 
  c.category_id,
  c.category_name,
  c.description,
  COUNT(p.product_id) as product_count
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = TRUE
GROUP BY c.category_id
ORDER BY c.display_order;
```

#### 4. React Renders Dropdown:
```javascript
<select name="category_id" onChange={handleInputChange}>
  <option value="">Select Category</option>
  {categories.map(cat => (
    <option key={cat.category_id} value={cat.category_id}>
      {cat.category_name} ({cat.product_count} products)
    </option>
  ))}
</select>
```

**User sees**:
```
Select Category ▼
  Vegetables (8 products)
  Fruits (6 products)
  Dairy (4 products)
  Grains (3 products)
  ...
```

---

## 📡 HTTP Methods & REST API

### Understanding HTTP Verbs

| Method | Purpose | SQL Equivalent | Example |
|--------|---------|----------------|---------|
| **GET** | Read data | SELECT | Get all products |
| **POST** | Create new | INSERT | Add new product |
| **PUT** | Update existing | UPDATE | Edit product |
| **DELETE** | Remove | DELETE | Delete product |

### Example API Endpoints:

```javascript
// GET - Read all products
GET http://localhost:5000/api/products
→ SELECT * FROM products

// GET - Read one product
GET http://localhost:5000/api/products/34
→ SELECT * FROM products WHERE product_id = 34

// POST - Create new product
POST http://localhost:5000/api/products
Body: { product_name: "Tomatoes", ... }
→ INSERT INTO products VALUES (...)

// PUT - Update product
PUT http://localhost:5000/api/products/34
Body: { product_name: "Fresh Tomatoes", ... }
→ UPDATE products SET ... WHERE product_id = 34

// DELETE - Remove product
DELETE http://localhost:5000/api/products/34
→ DELETE FROM products WHERE product_id = 34
```

---

## 🛠️ Error Handling Flow

### When Something Goes Wrong

#### Frontend Error:
```javascript
try {
  await axios.post('http://localhost:5000/api/products', productData);
  setMessage({ type: 'success', text: 'Product added!' });
} catch (error) {
  // HTTP error (400, 500, etc.)
  console.error('Error:', error.response?.data);
  setMessage({ 
    type: 'error', 
    text: error.response?.data?.error || 'Failed to save product' 
  });
}
```

#### Backend Error:
```javascript
router.post('/', async (req, res) => {
  try {
    // Validation error
    if (!product_name) {
      return res.status(400).json({ error: 'Product name required' });
    }
    
    // Execute SQL
    await db.query('INSERT INTO products ...', [data]);
    
  } catch (error) {
    // Database error (connection, constraint violation, etc.)
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
});
```

#### SQL Error Examples:
```sql
-- Foreign key constraint violation
INSERT INTO products (farmer_id, ...) VALUES (999, ...);
-- Error: farmer_id 999 doesn't exist in users table

-- Duplicate entry
INSERT INTO users (email) VALUES ('alice@gmail.com');
-- Error: email must be unique

-- Invalid data type
INSERT INTO products (price) VALUES ('invalid');
-- Error: price must be DECIMAL
```

---

## 🔄 State Management in React

### How Data Flows in Frontend

```javascript
// 1. Component has state
const [products, setProducts] = useState([]);        // Empty array initially
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(true);

// 2. Fetch data from backend
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    const response = await axios.get('http://localhost:5000/api/products');
    setProducts(response.data);  // Updates state
    setLoading(false);
  };
  fetchData();
}, []);  // Runs once when component mounts

// 3. React re-renders when state changes
return (
  <div>
    {loading ? (
      <p>Loading products...</p>
    ) : (
      products.map(product => (
        <ProductCard key={product.product_id} product={product} />
      ))
    )}
  </div>
);
```

### State Update Triggers:
- **Initial Load**: Component mounts → fetch data → update state → render
- **User Action**: Click button → call API → update state → re-render
- **Form Submit**: Submit form → send data → receive response → update state → re-render

---

## 📚 Summary: The Complete Journey

### **User Adds a Product (Complete Flow)**

1. **User fills form** in browser
   - Product name, category, price, etc.

2. **React sends HTTP POST** to backend
   - `axios.post('http://localhost:5000/api/products', data)`

3. **Express receives request**
   - Routes to products.js
   - Extracts data from req.body

4. **Backend validates data**
   - Checks required fields
   - Validates data types

5. **Backend creates SQL query**
   - `INSERT INTO products VALUES (?)`
   - Replaces ? with actual values

6. **MySQL connection pool**
   - Gets available connection
   - Sends query to MySQL server

7. **MySQL executes query**
   - Validates constraints
   - Auto-generates product_id
   - Inserts row into table
   - Returns result with insertId

8. **Backend receives SQL result**
   - Checks for errors
   - Formats response

9. **Backend sends HTTP response**
   - Status 201 (Created)
   - JSON with success message and product_id

10. **React receives response**
    - Updates success message state
    - Closes form modal
    - Fetches updated products list

11. **React re-fetches products**
    - GET request to /api/products
    - Backend queries: `SELECT * FROM products`

12. **React re-renders UI**
    - New product appears in list
    - User sees updated page

---

## 🎓 Key Concepts

### **Why This Architecture?**

1. **Separation of Concerns**
   - Frontend: User interface & interaction
   - Backend: Business logic & validation
   - Database: Data storage & relationships

2. **Security**
   - Passwords hashed in database (bcrypt)
   - SQL injection prevented (parameterized queries)
   - Authentication with JWT tokens

3. **Scalability**
   - Connection pooling for multiple users
   - Async/await for non-blocking operations
   - RESTful API design

4. **Maintainability**
   - Clear folder structure
   - Modular routes
   - Reusable components

---

## 🚀 Technologies Explained

### **Frontend (React)**
- **Purpose**: User interface that runs in browser
- **Responsibilities**: Display data, handle user input, send API requests
- **Tools**: React components, hooks (useState, useEffect), axios for HTTP

### **Backend (Express.js)**
- **Purpose**: Server that processes requests and talks to database
- **Responsibilities**: Validate data, execute SQL queries, send responses
- **Tools**: Express routes, middleware, MySQL connection

### **Database (MySQL)**
- **Purpose**: Persistent data storage
- **Responsibilities**: Store data, enforce relationships, ensure integrity
- **Tools**: Tables, foreign keys, indexes, transactions

---

This is how your Green Market application connects all three layers to create a full-stack e-commerce platform! 🌱✨
