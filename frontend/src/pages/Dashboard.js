import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI, wishlistAPI } from '../services/api';

function Dashboard({ user }) {
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
      if (user.role === 'buyer') {
        fetchWishlist();
      }
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getUserOrders(user.userId);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await wishlistAPI.getUserWishlist(user.userId);
      setWishlist(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user.username}!</h1>
        <div className="user-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 My Orders
        </button>
        {user.role === 'buyer' && (
          <button 
            className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            ❤️ Wishlist
          </button>
        )}
      </div>

      <div className="dashboard-content">
        {activeTab === 'orders' && (
          <div className="orders-tab">
            <h2>Your Orders</h2>
            
            {loading ? (
              <p>Loading orders...</p>
            ) : orders.length > 0 ? (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.order_id} className="order-card">
                    <div className="order-header">
                      <div>
                        <strong>Order #{order.order_number}</strong>
                        <p className="order-date">
                          {new Date(order.order_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`order-status ${order.status.toLowerCase().replace(' ', '-')}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="order-items">
                      {order.items && order.items.map(item => (
                        <div key={item.order_item_id} className="order-item">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span>₹{item.total_price}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-footer">
                      <div className="order-total">
                        <strong>Total: ₹{order.final_amount}</strong>
                      </div>
                      <div className="order-actions">
                        <Link 
                          to={`/order-tracking/${order.order_id}`}
                          className="btn btn-primary btn-small"
                        >
                          Track Order
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>😔 No orders yet</p>
                <Link to="/products" className="btn btn-success">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wishlist' && user.role === 'buyer' && (
          <div className="wishlist-tab">
            <h2>Your Wishlist</h2>
            
            {wishlist.length > 0 ? (
              <div className="products-grid">
                {wishlist.map(item => (
                  <div key={item.wishlist_id} className="wishlist-item">
                    <Link to={`/product/${item.product_id}`}>
                      {item.image_url ? (
                        <img src={`http://localhost:5000${item.image_url}`} alt={item.name} />
                      ) : (
                        <div className="wishlist-placeholder">🌱</div>
                      )}
                      <h4>{item.name}</h4>
                      <p className="wishlist-price">₹{item.price}</p>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>💔 Your wishlist is empty</p>
                <Link to="/products" className="btn btn-success">
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;