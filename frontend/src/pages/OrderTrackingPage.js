// ==========================================
// frontend/src/pages/OrderTrackingPage.js - REAL-TIME
// ==========================================
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import OrderTracking from '../components/OrderTracking';
import { ordersAPI } from '../services/api';

function OrderTrackingPage({ user }) {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveUpdate, setLiveUpdate] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchOrderDetails();
    
    // Initialize Socket.IO connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to real-time updates');
      // Join room for this specific order
      socket.emit('trackOrder', orderId);
    });

    // Listen for real-time order status updates
    socket.on('orderStatusUpdate', (data) => {
      console.log('📡 Real-time update received:', data);
      
      if (data.orderId == orderId) {
        // Show live update notification
        setLiveUpdate({
          status: data.status,
          location: data.location,
          description: data.description,
          timestamp: data.timestamp
        });

        // Refresh order details
        fetchOrderDetails();

        // Hide notification after 5 seconds
        setTimeout(() => {
          setLiveUpdate(null);
        }, 5000);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time updates');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await ordersAPI.getById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{textAlign: 'center', padding: '4rem 2rem'}}>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <div style={{textAlign: 'center', padding: '4rem 2rem'}}>
          <h2>Order not found</h2>
          <p>The order you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Real-time Update Notification */}
      {liveUpdate && (
        <div className="live-update-notification">
          <div className="live-update-content">
            <div className="live-dot"></div>
            <div>
              <strong>🔴 LIVE UPDATE</strong>
              <p>{liveUpdate.status} - {liveUpdate.description}</p>
            </div>
          </div>
        </div>
      )}

      <div className="order-tracking-page">
        <div className="tracking-header">
          <h2>📦 Order Tracking</h2>
          <div className="live-indicator">
            <span className="pulse-dot"></span>
            <span>Real-time updates enabled</span>
          </div>
        </div>
        
        <div className="order-info-card">
          <div className="order-info-header">
            <div>
              <h3>Order #{order.order_number}</h3>
              <p>Placed on: {new Date(order.order_date).toLocaleString()}</p>
            </div>
            <div className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
              {order.status}
            </div>
          </div>

          <div className="order-details-grid">
            <div className="detail-item">
              <strong>Tracking ID:</strong>
              <p>{order.tracking_id}</p>
            </div>
            <div className="detail-item">
              <strong>Payment Method:</strong>
              <p>{order.payment_method}</p>
            </div>
            <div className="detail-item">
              <strong>Total Amount:</strong>
              <p>₹{order.final_amount}</p>
            </div>
            <div className="detail-item">
              <strong>Expected Delivery:</strong>
              <p>{new Date(order.expected_delivery_date).toLocaleDateString()}</p>
            </div>
          </div>

          {order.delivery_address && (
            <div className="delivery-address">
              <strong>Delivery Address:</strong>
              <p>{order.delivery_address}</p>
            </div>
          )}
        </div>

        <div className="order-items-card">
          <h3>Order Items</h3>
          <div className="tracking-order-items">
            {order.items && order.items.map(item => (
              <div key={item.order_item_id} className="tracking-order-item">
                {item.image_url ? (
                  <img src={`http://localhost:5000${item.image_url}`} alt={item.product_name} />
                ) : (
                  <div className="item-placeholder">🌱</div>
                )}
                <div className="item-details">
                  <h4>{item.product_name}</h4>
                  <p>Quantity: {item.quantity}</p>
                  <p className="item-price">₹{item.total_price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tracking-timeline-card">
          <h3>Order Timeline</h3>
          <OrderTracking tracking={order.tracking} />
        </div>

        {order.status === 'Delivered' && (
          <div className="delivered-banner">
            <h3>🎉 Order Delivered Successfully!</h3>
            <p>Thank you for shopping with Green Market!</p>
            <p>📧 A confirmation email has been sent to your inbox.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderTrackingPage;