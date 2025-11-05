import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productsAPI } from '../services/api';

function Home({ addToCart }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productsAPI.getAll({ sort: 'popular' });
      setFeaturedProducts(response.data.slice(0, 8));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>🌱 Welcome to Green Market</h1>
          <p className="hero-subtitle">Fresh Farm Products Delivered Directly to Your Door</p>
          <p className="hero-description">
            Connect directly with local farmers and get the freshest produce at the best prices
          </p>
          <div className="hero-buttons">
            <Link to="/products" className="btn btn-primary btn-large">
              Shop Now
            </Link>
            <Link to="/about" className="btn btn-secondary btn-large">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Green Market?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌾</div>
              <h3>Farm Fresh</h3>
              <p>Products delivered straight from the farm to your home</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>Quick and reliable delivery within 2-3 days</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💯</div>
              <h3>Quality Assured</h3>
              <p>100% organic and quality-checked products</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Best Prices</h3>
              <p>Direct from farmers means better prices for you</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-grid">
            {categories.slice(0, 6).map(category => (
              <Link 
                key={category.category_id} 
                to={`/products?category=${category.name}`}
                className="category-card"
              >
                <div className="category-image">
                  {category.image_url ? (
                    <img src={category.image_url} alt={category.name} />
                  ) : (
                    <div className="category-placeholder">
                      {getCategoryEmoji(category.name)}
                    </div>
                  )}
                </div>
                <h3>{category.name}</h3>
                <p>{category.product_count} products</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/products" className="view-all-link">View All →</Link>
          </div>
          
          <div className="products-grid">
            {featuredProducts.map(product => (
              <ProductCard 
                key={product.product_id} 
                product={product} 
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Browse Products</h3>
              <p>Explore our wide range of fresh farm products</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Add to Cart</h3>
              <p>Select your items and add them to cart</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Checkout</h3>
              <p>Complete your order with secure payment</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Get Delivered</h3>
              <p>Receive fresh products at your doorstep</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p>"The best place to buy fresh vegetables! Quality is amazing and delivery is super fast."</p>
              <div className="testimonial-author">- Alice Kumar</div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p>"Love supporting local farmers directly. Products are always fresh and prices are great!"</p>
              <div className="testimonial-author">- Charlie Patel</div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p>"Excellent service! The organic produce is worth every penny. Highly recommended!"</p>
              <div className="testimonial-author">- Grace Nair</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function getCategoryEmoji(category) {
  const emojiMap = {
    'Vegetables': '🥬', 'Fruits': '🍎', 'Dairy': '🥛',
    'Grains': '🌾', 'Spices': '🌶️', 'Bakery': '🍞',
    'Beverages': '🥤', 'Snacks': '🍿', 'Oils': '🫗', 'Pulses': '🫘',
  };
  return emojiMap[category] || '🌱';
}

export default Home;