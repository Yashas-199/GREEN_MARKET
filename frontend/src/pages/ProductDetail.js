import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, reviewsAPI, wishlistAPI } from '../services/api';
import './ProductDetail.css';

function ProductDetail({ addToCart, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    if (user) {
      checkWishlist();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getProductReviews(id);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkWishlist = async () => {
    try {
      const response = await wishlistAPI.check(id);
      setInWishlist(response.data.inWishlist);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (quantity > product.quantity) {
      alert('Not enough stock available!');
      return;
    }
    addToCart(product, quantity);
    alert('Added to cart successfully!');
  };

  const handleWishlist = async () => {
    if (!user) {
      alert('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    try {
      if (inWishlist) {
        await wishlistAPI.remove(id);
        setInWishlist(false);
        alert('Removed from wishlist');
      } else {
        await wishlistAPI.add(id);
        setInWishlist(true);
        alert('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      alert('Failed to update wishlist');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setMessage('Please login to submit a review');
      return;
    }

    if (user.role !== 'buyer') {
      setMessage('Only buyers can submit reviews');
      return;
    }

    if (rating === 0) {
      setMessage('Please select a rating');
      return;
    }

    try {
      await reviewsAPI.add({
        productId: id,
        rating,
        comment,
      });
      setMessage('Review submitted successfully!');
      setRating(0);
      setComment('');
      fetchReviews();
      fetchProduct();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!product) {
    return <div className="container">Product not found</div>;
  }

  return (
    <div className="container">
      <div className="product-detail">
        <div className="product-detail-content">
          <div className="product-detail-image-wrapper">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.product_name}
                className="product-detail-image-real"
              />
            ) : (
              <div className="product-detail-image">
                {getProductEmoji(product.category_name)}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <div className="product-category">{product.category_name}</div>
            <h1>{product.product_name}</h1>
            
            <div className="product-rating-large">
              {product.review_count > 0 ? (
                <>⭐ {product.avg_rating} ({product.review_count} reviews)</>
              ) : (
                <>No reviews yet</>
              )}
            </div>

            <div className="product-price-large">₹{product.price} / {product.unit}</div>
            
            <p className="product-description-full">{product.description}</p>
            
            <div className="product-meta">
              <p className="product-stock">
                {product.quantity > 0 ? (
                  <span style={{color: '#10b981'}}>✅ In Stock: {product.quantity} units</span>
                ) : (
                  <span style={{color: '#ef4444'}}>❌ Out of Stock</span>
                )}
              </p>
              
              <p className="product-farmer">
                <strong>👨‍🌾 Farmer:</strong> {product.farmer_name}<br />
                {product.farmer_address && (
                  <><strong>📍 Location:</strong> {product.farmer_address}</>
                )}
              </p>
            </div>

            {product.quantity > 0 && (
              <>
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={product.quantity}
                  />
                  <button onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}>+</button>
                </div>

                <div className="product-actions">
                  <button className="btn btn-success btn-large" onClick={handleAddToCart}>
                    🛒 Add to Cart
                  </button>
                  <button 
                    className={`btn ${inWishlist ? 'btn-danger' : 'btn-secondary'} btn-large`}
                    onClick={handleWishlist}
                  >
                    {inWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h3>Customer Reviews</h3>

          {user && user.role === 'buyer' && (
            <div className="review-form">
              <h4>Write a Review</h4>
              {message && (
                <div className={message.includes('success') ? 'success-message' : 'error-message'}>
                  {message}
                </div>
              )}
              <form onSubmit={handleSubmitReview}>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`star ${rating >= star ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <textarea
                  placeholder="Share your experience with this product..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-success">
                  Submit Review
                </button>
              </form>
            </div>
          )}

          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.review_id} className="review-item">
                  <div className="review-header">
                    <div>
                      <div className="review-author">
                        {review.username}
                        {review.is_verified_purchase && (
                          <span className="verified-badge">✓ Verified Purchase</span>
                        )}
                      </div>
                      <div className="product-rating">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <div className="review-date">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))
            ) : (
              <p style={{color: '#666', textAlign: 'center', padding: '2rem'}}>
                No reviews yet. Be the first to review this product!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getProductEmoji(category) {
  const emojiMap = {
    'Vegetables': '🥬', 'Fruits': '🍎', 'Dairy': '🥛',
    'Grains': '🌾', 'Spices': '🌶️', 'Bakery': '🍞',
    'Beverages': '🥤', 'Snacks': '🍿', 'Oils': '🫗', 'Pulses': '🫘',
  };
  return emojiMap[category] || '🌱';
}

export default ProductDetail;