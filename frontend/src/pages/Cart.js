import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Cart({ cart, updateQuantity, removeItem, clearCart, user }) {
  const navigate = useNavigate();

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDeliveryCharge = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 500 ? 0 : 40;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryCharge();
  };

  const handleCheckout = () => {
    if (!user) {
      alert('Please login to checkout');
      navigate('/login');
      return;
    }

    if (user.role !== 'user' && user.role !== 'buyer') {
      alert('Only customers can place orders');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    navigate('/checkout');
  };

  const getProductEmoji = (category) => {
    const emojiMap = {
      'Vegetables': '🥬', 'Fruits': '🍎', 'Dairy': '🥛',
      'Grains': '🌾', 'Spices': '🌶️', 'Bakery': '🍞',
      'Beverages': '🥤', 'Snacks': '🍿', 'Oils': '🫗', 'Pulses': '🫘',
    };
    return emojiMap[category] || '🌱';
  };

  if (cart.length === 0) {
    return (
      <div className="container">
        <div className="cart-page">
          <h2>Shopping Cart</h2>
          <div className="cart-empty">
            <p style={{fontSize: '4rem', marginBottom: '1rem'}}>🛒</p>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything to your cart yet</p>
            <button 
              className="btn btn-success" 
              onClick={() => navigate('/products')}
              style={{marginTop: '1.5rem'}}
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="cart-page">
        <h2>Shopping Cart ({cart.length} items)</h2>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item-image">
                  {item.image_url ? (
                    <img src={`http://localhost:5000${item.image_url}`} alt={item.product_name || item.name} />
                  ) : (
                    <div className="cart-item-emoji">
                      {getProductEmoji(item.category_name)}
                    </div>
                  )}
                </div>
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.product_name || item.name}</h3>
                  <p className="cart-item-price">₹{item.price} / {item.unit}</p>
                  <p className="cart-item-category">{item.category_name}</p>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-selector">
                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                      −
                    </button>
                    <input 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                      min="1"
                    />
                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => removeItem(item.product_id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Charge:</span>
              <span>₹{calculateDeliveryCharge().toFixed(2)}</span>
            </div>
            {calculateSubtotal() < 500 && (
              <p className="free-delivery-note">
                Add ₹{(500 - calculateSubtotal()).toFixed(2)} more for FREE delivery!
              </p>
            )}
            <div className="summary-divider"></div>
            <div className="cart-total">
              <span>Total:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
            <button 
              className="btn btn-success btn-large" 
              style={{width: '100%', marginTop: '1rem'}}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
            <button 
              className="btn btn-secondary" 
              style={{width: '100%', marginTop: '0.5rem'}}
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;