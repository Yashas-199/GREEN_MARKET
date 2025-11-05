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

      <style jsx>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f4f6;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .tracking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #10b981;
          font-weight: 600;
        }

        .pulse-dot {
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .live-update-notification {
          position: fixed;
          top: 100px;
          right: 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 1.5rem;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
          z-index: 1000;
          animation: slideIn 0.5s ease-out;
          max-width: 400px;
        }

        @keyframes slideIn {
          from {
            transform: translateX(500px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .live-update-content {
          display: flex;
          gap: 1rem;
          align-items: start;
        }

        .live-dot {
          width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 50%;
          flex-shrink: 0;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .live-update-content strong {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .live-update-content p {
          margin: 0;
          opacity: 0.95;
        }

        .item-placeholder {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
        }

        .delivered-banner {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          padding: 2rem;
          border-radius: 15px;
          text-align: center;
          margin-top: 2rem;
        }

        .delivered-banner h3 {
          color: #059669;
          margin-bottom: 1rem;
        }

        .delivered-banner p {
          color: #047857;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}

export default OrderTrackingPage;