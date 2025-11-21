# 🌱 Green Market - Farm to Home Platform

Green Market is a comprehensive e-commerce platform that directly connects farmers with customers, enabling fresh farm produce to reach consumers without intermediaries. The platform supports real-time order tracking, product reviews, wishlists, and separate dashboards for farmers and customers.

---


##  Features

### Core Features
- **Product Catalog** - Browse fresh farm products with filters and search
- **Real-time Updates** - Socket.IO powered live order tracking
- **Farmer Dashboard** - Product management, order tracking, and sales analytics
- **Customer Dashboard** - Order history, wishlist, and profile management
- **Order Management** - Complete order lifecycle from placement to delivery
- **Product Reviews** - Rating and review system for verified purchases
- **Wishlist** - Save favorite products for later
- **Secure Authentication** - JWT-based authentication with role management
- **Multiple Payment Methods** - COD, Online, UPI, Card support
- **Order Tracking** - Real-time order status and location tracking
- **Coupon System** - Discount coupons with usage limits
- **Email Notifications** - Order confirmations and updates
- **Analytics** - Sales reports and product performance metrics

---

##  Tech Stack

### Frontend
- **React** 18.2.0 - UI framework
- **React Router DOM** 6.20.0 - Client-side routing
- **Axios** 1.13.1 - HTTP client
- **Socket.IO Client** 4.8.1 - Real-time communication
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** 4.18.2 - Web framework
- **MySQL2** 3.6.5 - Database driver
- **Socket.IO** 4.8.1 - Real-time server
- **JWT** 9.0.2 - Authentication
- **Bcrypt** 6.0.0 - Password hashing
- **Multer** 1.4.5 - File uploads
- **Nodemailer** 6.9.7 - Email service
- **Express Validator** 7.0.1 - Input validation

### Database
- **MySQL** 8.0+ - Relational database

---

##  Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.x or higher) - [Download](https://nodejs.org/)
- **npm** (v6.x or higher) - Comes with Node.js
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)

Verify installations:
```bash
node --version
npm --version
mysql --version
```

---

##  Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Yashas-199/GREEN_MARKET.git
cd GREEN_MARKET
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

##  Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=green_market
DB_PORT=3306

# JWT Secret
JWT_SECRET=green_market_secret_key_2024

# Email Configuration (Optional - for Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Green Market <noreply@greenmarket.com>

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 🗄️ Database Setup

### 1. Create Database

Log into MySQL:
```bash
mysql -u root -p
```

### 2. Import Database Schema

The project includes a complete database schema in `database.sql`. Import it:

```bash
mysql -u root -p < database.sql
```

**OR** run from MySQL prompt:
```sql
source /path/to/GREEN_MARKET/database.sql;
```

### 3. Verify Database Creation

```sql
USE green_market;
SHOW TABLES;
```

You should see all 11 tables listed.

---

## ▶️ Running the Application

### Development Mode

#### 1. Start Backend Server
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:5000`

#### 2. Start Frontend Development Server
Open a new terminal:
```bash
cd frontend
npm start
```
Frontend runs on: `http://localhost:3000`

### Production Mode

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the build folder with a static server
```

---



##  User Roles & Functionalities

### 1. Customer/User Role

#### Features:
- Browse and search products
- Filter products by category, price, rating
- View detailed product information
- Add products to cart
- Place orders with multiple items
- Track order status in real-time
- Add/remove products from wishlist
- Write product reviews (verified purchases only)
- View order history
- Manage delivery addresses
- Apply coupon codes
- Receive notifications
- Contact support

#### User Dashboard Sections:
1. **My Orders** - View all orders with status
2. **Order Tracking** - Real-time tracking of active orders
3. **Wishlist** - Saved products
4. **Profile** - Personal information and addresses
5. **Reviews** - Reviews written
6. **Notifications** - Order updates and promotions

### 2. Farmer Role

#### Features:
- Register as a farmer
- Add new products to catalog
- Update product information (price, quantity, description)
- Upload product images
- Delete products
- View sales statistics
- Manage inventory
- View and manage orders
- Update order status
- View customer information
- Track revenue and earnings
- Receive order notifications
- View product performance

#### Farmer Dashboard Sections:
1. **Dashboard Overview**
   - Total Products Count
   - Total Sales (₹)
   - Active Orders Count
   - Revenue Analytics

2. **My Products**
   - Product List with Edit/Delete options
   - Add New Product form
   - Stock management
   - Product performance metrics

3. **Orders**
   - Pending orders
   - Order history
   - Order details with customer info
   - Update order status

4. **Analytics**
   - Best-selling products
   - Sales trends
   - Customer feedback
   - Revenue reports

### 3. Admin Role

#### Features:
- Full platform access
- Manage all users (customers and farmers)
- Approve/reject farmer registrations
- Manage all products
- View all orders
- Manage categories
- Create and manage coupons
- View platform analytics
- Handle customer support
- Send notifications
- Generate reports

#### Admin Dashboard Sections:
1. **Dashboard**
   - Total Users
   - Total Farmers
   - Total Products
   - Total Orders
   - Revenue Overview

2. **User Management**
   - List all users
   - Activate/deactivate accounts
   - View user details
   - Manage roles

3. **Product Management**
   - All products listing
   - Approve new products
   - Edit/delete products
   - Manage categories

4. **Order Management**
   - All orders
   - Order status updates
   - Refund management
   - Delivery tracking

5. **Coupons**
   - Create coupons
   - Manage active coupons
   - View usage statistics

6. **Reports**
   - Sales reports
   - Revenue analytics
   - User activity
   - Product performance

---

## 📁 Project Structure

```
GREEN_MARKET/
├── backend/
│   ├── config/
│   │   ├── database.js          # Database connection (mysql)
│   │   ├── db.js                # Alternative DB config
│   │   └── email.js             # Email configuration
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── upload.js            # File upload configuration
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── products.js          # Product routes
│   │   ├── farmerRoutes.js      # Farmer-specific routes
│   │   ├── orders.js            # Order management routes
│   │   ├── reviews.js           # Review routes
│   │   ├── wishlist.js          # Wishlist routes
│   │   ├── notifications.js     # Notification routes
│   │   └── admin.js             # Admin routes
│   ├── uploads/                 # Product images storage
│   ├── utils/
│   │   ├── emailTemplates.js    # Email templates
│   │   └── helpers.js           # Helper functions
│   ├── .env                     # Environment variables
│   ├── package.json             # Backend dependencies
│   └── server.js                # Express server entry point
│
├── frontend/
│   ├── public/
│   │   ├── index.html           # HTML template
│   │   └── images/              # Static images
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js        # Navigation bar
│   │   │   ├── Navbar.css       # Navbar styles
│   │   │   ├── Footer.js        # Footer component
│   │   │   ├── ProductCard.js   # Product card component
│   │   │   └── OrderTracking.js # Order tracking component
│   │   ├── pages/
│   │   │   ├── Home.js          # Home page
│   │   │   ├── Products.js      # Products listing
│   │   │   ├── Products.css     # Products page styles
│   │   │   ├── ProductDetail.js # Product details
│   │   │   ├── ProductDetail.css# Product detail styles
│   │   │   ├── Login.js         # Login page
│   │   │   ├── Register.js      # Registration page
│   │   │   ├── Dashboard.js     # Customer dashboard
│   │   │   ├── FarmerDashboard.js    # Farmer dashboard
│   │   │   ├── FarmerDashboard.css   # Farmer dashboard styles
│   │   │   ├── Cart.js          # Shopping cart
│   │   │   ├── Checkout.js      # Checkout page
│   │   │   ├── OrderTrackingPage.js  # Order tracking
│   │   │   ├── About.js         # About page
│   │   │   └── Contact.js       # Contact page
│   │   ├── services/
│   │   │   └── api.js           # API service functions
│   │   ├── styles/
│   │   │   └── FarmerDashboard.css
│   │   ├── App.js               # Main App component
│   │   ├── App.css              # App styles
│   │   ├── index.js             # React entry point
│   │   └── index.css            # Global styles
│   ├── .env                     # Frontend environment variables
│   └── package.json             # Frontend dependencies
│
├── database.sql                 # Complete database schema with sample data
└── README.md                    # This file
```

---

##  Screenshots

### Home Page
- Hero section with call-to-action
- Featured products
- Category showcase
- Testimonials

### Products Page
- Product grid with filtering
- Sort options (price, rating, popularity)
- Search functionality
- Category filters
- Add to cart buttons

### Product Detail
- Product images
- Detailed description
- Pricing and availability
- Customer reviews
- Add to cart/wishlist
- Farmer information

### Customer Dashboard
- Order history
- Order tracking
- Wishlist
- Profile management
- Reviews

### Farmer Dashboard
- Sales analytics
- Product management
- Order management
- Add/Edit products
- Inventory tracking

### Cart & Checkout
- Cart items list
- Quantity adjustment
- Price calculation
- Delivery address form
- Payment method selection
- Order summary

---

##  Default Test Credentials

### Admin Account
- **Email:** admin@greenmarket.com
- **Password:** pass123
- **Role:** Admin

### Farmer Accounts
1. **Alice Farmer**
   - Email: alice@gmail.com
   - Password: pass123
   - Location: Green Valley Farm, Patna

2. **Charlie Farmer**
   - Email: charlie@gmail.com
   - Password: pass123
   - Location: Fresh Fields Farm, Danapur

### Customer Accounts
1. **Bob Customer**
   - Email: bob@gmail.com
   - Password: pass123

2. **David Customer**
   - Email: david@gmail.com
   - Password: pass123
---

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

##   Author

**Yashas Krishna**
- GitHub: [@Yashas-199](https://github.com/Yashas-199)
- Repository: [GREEN_MARKET](https://github.com/Yashas-199/GREEN_MARKET)

---

##  Acknowledgments

- React community for excellent documentation
- Express.js for powerful backend framework
- MySQL for robust database management
- Socket.IO for real-time capabilities
- All contributors and testers

---

##  Database Statistics

- **Total Tables:** 11
- **Total Views:** 3
- **Stored Procedures:** 3
- **Triggers:** 6
- **Sample Products:** 33
- **Sample Orders:** 4
- **Default Categories:** 8

---