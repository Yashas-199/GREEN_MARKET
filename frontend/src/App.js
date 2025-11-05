import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTrackingPage from './pages/OrderTrackingPage';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedCart = localStorage.getItem('cart');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
    
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCart([]);
    localStorage.removeItem('cart');
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.product_id === product.product_id);
    
    let newCart;
    if (existingItem) {
      newCart = cart.map(item =>
        item.product_id === product.product_id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity }];
    }
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const newCart = cart.map(item =>
      item.product_id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.product_id !== productId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  return (
    <Router>
      <div className="App">
        <Navbar 
          user={user}
          onLogout={handleLogout}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        />
        <Routes>
          <Route path="/" element={<Home addToCart={addToCart} />} />
          <Route path="/products" element={<Products addToCart={addToCart} />} />
          <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} user={user} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          
          <Route 
            path="/login" 
            element={
              isLoggedIn ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } 
          />
          
          <Route 
            path="/register" 
            element={
              isLoggedIn ? <Navigate to="/" /> : <Register />
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              isLoggedIn && (user?.role === 'user' || user?.role === 'buyer')
                ? <Dashboard user={user} /> 
                : <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/farmer-dashboard" 
            element={
              isLoggedIn && user?.role === 'farmer' 
                ? <FarmerDashboard /> 
                : <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/cart" 
            element={
              <Cart 
                cart={cart} 
                updateQuantity={updateCartQuantity}
                removeItem={removeFromCart}
                clearCart={clearCart}
                user={user}
              />
            } 
          />
          
          <Route 
            path="/checkout" 
            element={
              <Checkout 
                cart={cart} 
                user={user}
                clearCart={clearCart}
              />
            } 
          />
          
          <Route 
            path="/order-tracking/:orderId" 
            element={
              isLoggedIn ? <OrderTrackingPage user={user} /> : <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;