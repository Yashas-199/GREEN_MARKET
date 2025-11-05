import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Products.css';

const API_URL = 'http://localhost:5000/api';

function Products({ addToCart }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    search: searchParams.get('search') || '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'latest'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/categories`);
      console.log('Categories:', response.data);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (filters.category !== 'all') {
        const selectedCategory = categories.find(c => c.category_id === parseInt(filters.category));
        if (selectedCategory) {
          params.append('category', selectedCategory.category_name);
        }
      }
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      console.log('Fetching products with params:', params.toString());
      const response = await axios.get(`${API_URL}/products?${params.toString()}`);
      console.log('Products response:', response.data);
      
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(name, value);
    } else {
      newParams.delete(name);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      search: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'latest'
    });
    setSearchParams(new URLSearchParams());
  };

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      addToCart(product, 1);
      alert('✅ Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('❌ Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="page-container">
        <div className="page-header">
          <h1>🛒 All Products</h1>
          <p>Browse our fresh selection of farm products</p>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-row">
            {/* Search */}
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="🔍 Search products..."
                className="form-input"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <label>Category</label>
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name} ({cat.product_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group price-range">
              <label>Price Range</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min ₹"
                  className="form-input"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  className="form-input"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="filter-group">
              <label>Sort By</label>
              <select
                className="form-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="latest">Latest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          <div className="results-info">
            <span>📦 {products.length} products found</span>
            {(filters.category !== 'all' || filters.search || filters.minPrice || filters.maxPrice) && (
              <button 
                className="btn btn-sm btn-secondary"
                onClick={clearFilters}
              >
                🔄 Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No Products Found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button className="btn btn-primary" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div 
                key={product.product_id} 
                className="product-card"
                onClick={() => navigate(`/product/${product.product_id}`)}
              >
                <div className="product-image">
                  <img 
                    src={product.image_url || 'https://via.placeholder.com/300?text=No+Image'} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                    }}
                  />
                  {product.quantity < 10 && product.quantity > 0 && (
                    <span className="badge badge-warning low-stock">
                      ⚠️ Only {product.quantity} left
                    </span>
                  )}
                  {product.quantity === 0 && (
                    <span className="badge badge-danger out-stock">
                      ❌ Out of Stock
                    </span>
                  )}
                </div>
                <div className="product-info">
                  <span className="product-category">
                    🏷️ {product.category_name || 'Uncategorized'}
                  </span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">
                    {product.description?.substring(0, 80)}...
                  </p>
                  <div className="product-rating">
                    {'⭐'.repeat(Math.round(product.avg_rating || 0))}
                    {'☆'.repeat(5 - Math.round(product.avg_rating || 0))}
                    <span>({product.review_count || 0} reviews)</span>
                  </div>
                  <div className="product-farmer">
                    <span>👨‍🌾 {product.farmer_name || 'Green Market'}</span>
                  </div>
                  <div className="product-footer">
                    <div className="product-price">
                      <span className="price">₹{product.price}</span>
                      <span className="unit">/{product.unit || 'kg'}</span>
                    </div>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={product.quantity === 0}
                    >
                      {product.quantity === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;