import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';

function Navbar({ user, onLogout, cartCount }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchNotifications();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/notifications/user/${user.user_id}/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Set to 0 if error (e.g., notifications not implemented yet)
      setUnreadCount(0);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/notifications/user/${user.user_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data.slice(0, 5)); // Show latest 5
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/notifications/user/${user.user_id}/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleLogout = () => {
    onLogout();
    setMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          🌱 Green Market
        </Link>

        <div className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/products" className="nav-link" onClick={closeMenu}>Products</Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-link" onClick={closeMenu}>About</Link>
          </li>
          <li className="nav-item">
            <Link to="/contact" className="nav-link" onClick={closeMenu}>Contact</Link>
          </li>

          {user ? (
            <>
              {/* Dashboard link based on role */}
              {user.role === 'farmer' && (
                <li className="nav-item">
                  <Link to="/farmer-dashboard" className="nav-link" onClick={closeMenu}>
                    Dashboard
                  </Link>
                </li>
              )}
              {user.role === 'admin' && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link" onClick={closeMenu}>
                    Admin Panel
                  </Link>
                </li>
              )}
              {user.role === 'user' && (
                <li className="nav-item">
                  <Link to="/orders" className="nav-link" onClick={closeMenu}>
                    My Orders
                  </Link>
                </li>
              )}

              {/* Mobile menu items */}
              <li className="nav-item mobile-only">
                <Link to="/profile" className="nav-link" onClick={closeMenu}>
                  👤 Profile
                </Link>
              </li>
              <li className="nav-item mobile-only">
                <button onClick={handleLogout} className="nav-link btn-logout-mobile">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item mobile-only">
                <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
              </li>
              <li className="nav-item mobile-only">
                <Link to="/register" className="nav-link btn-register" onClick={closeMenu}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Right side icons (desktop only) */}
        <div className="nav-actions">
          {/* Notifications */}
          {user && (
            <div className="notification-wrapper">
              <div 
                className="notification-icon" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>
              
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="mark-read-btn">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div 
                          key={notif.notification_id} 
                          className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                          onClick={() => {
                            if (notif.link) navigate(notif.link);
                            setShowNotifications(false);
                          }}
                        >
                          <strong>{notif.title}</strong>
                          <p>{notif.message}</p>
                          <small>{new Date(notif.created_at).toLocaleString()}</small>
                        </div>
                      ))
                    ) : (
                      <p className="no-notifications">No notifications</p>
                    )}
                  </div>
                  <div className="notification-footer">
                    <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                      View All
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart - only for users/buyers */}
          {user && user.role === 'user' && (
            <div className="cart-icon" onClick={() => navigate('/cart')}>
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
          )}

          {/* User Menu (desktop only) */}
          {user ? (
            <div className="user-menu desktop-only">
              <span className="user-greeting">Hi, {user.name}!</span>
              <button className="btn btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons desktop-only">
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;