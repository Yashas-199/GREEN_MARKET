import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';

function Checkout({ cart, user, clearCart }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    deliveryInstructions: '',
    paymentMethod: 'COD',
    couponCode: ''
  });

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDeliveryCharge = () => {
    return calculateSubtotal() > 500 ? 0 : 40;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryCharge();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!user || (user.role !== 'user' && user.role !== 'buyer')) {
      alert('Only customers can place orders');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.product_id,
          quantity: item.quantity
        })),
        deliveryAddress: formData.deliveryAddress,
        deliveryInstructions: formData.deliveryInstructions,
        paymentMethod: formData.paymentMethod,
        couponCode: formData.couponCode || null
      };

      const response = await ordersAPI.create(orderData);
      
      alert('Order placed successfully!');
      clearCart();
      navigate(`/order-tracking/${response.data.orderId}`);
    } catch (error) {
      console.error('Order error:', error);
      alert(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'user' && user.role !== 'buyer')) {
    return (
      <div className="container">
        <div className="checkout-error">
          <h2>Access Denied</h2>
          <p>Only customers can access checkout</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="checkout-page">
        <h2>Checkout</h2>
        
        <div className="checkout-layout">
          <form onSubmit={handlePlaceOrder} className="checkout-form">
            <div className="form-section">
              <h3>Delivery Information</h3>
              <div className="form-group">
                <label>Delivery Address *</label>
                <textarea
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  required
                  placeholder="Enter your complete delivery address"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Delivery Instructions (Optional)</label>
                <textarea
                  name="deliveryInstructions"
                  value={formData.deliveryInstructions}
                  onChange={handleChange}
                  placeholder="Any special instructions for delivery"
                  rows="2"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Payment Method</h3>
              <div className="payment-methods">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={handleChange}
                  />
                  <span>💵 Cash on Delivery</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Online"
                    checked={formData.paymentMethod === 'Online'}
                    onChange={handleChange}
                  />
                  <span>💳 Online Payment</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={formData.paymentMethod === 'UPI'}
                    onChange={handleChange}
                  />
                  <span>📱 UPI</span>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Coupon Code</h3>
              <div className="form-group">
                <input
                  type="text"
                  name="couponCode"
                  value={formData.couponCode}
                  onChange={handleChange}
                  placeholder="Enter coupon code"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-success btn-large"
              disabled={loading}
              style={{width: '100%'}}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>

          <div className="checkout-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.product_id} className="summary-item">
                  <span>{item.product_name || item.name} x {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Charge:</span>
              <span>₹{calculateDeliveryCharge().toFixed(2)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;