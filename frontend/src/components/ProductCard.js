import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ product, onAddToCart }) {
  const getProductEmoji = (category) => {
    const emojiMap = {
      'Vegetables': '🥬', 'Fruits': '🍎', 'Dairy': '🥛',
      'Grains': '🌾', 'Spices': '🌶️', 'Bakery': '🍞',
      'Beverages': '🥤', 'Snacks': '🍿', 'Oils': '🫗', 'Pulses': '🫘',
    };
    return emojiMap[category] || '🌱';
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.product_id}`} style={{textDecoration: 'none', color: 'inherit'}}>
        <div className="product-image-wrapper">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name || product.name} className="product-image-real" />
          ) : (
            <div className="product-image">
              {getProductEmoji(product.category_name)}
            </div>
          )}
          {product.quantity === 0 && (
            <div className="out-of-stock-badge">Out of Stock</div>
          )}
        </div>
        <div className="product-info">
          <div className="product-category">{product.category_name}</div>
          <h3 className="product-name">{product.product_name || product.name}</h3>
          <p className="product-description">{product.description}</p>
          <div className="product-footer">
            <span className="product-price">₹{product.price}/{product.unit}</span>
            {product.review_count > 0 && (
              <div className="product-rating">
                ⭐ {product.avg_rating} ({product.review_count})
              </div>
            )}
          </div>
        </div>
      </Link>
      <div style={{padding: '0 1.5rem 1.5rem'}}>
        <button 
          className="btn btn-success" 
          style={{width: '100%'}}
          onClick={() => {
            if (product.quantity > 0) {
              onAddToCart(product);
              alert('Added to cart!');
            } else {
              alert('Product out of stock');
            }
          }}
          disabled={product.quantity === 0}
        >
          {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;     