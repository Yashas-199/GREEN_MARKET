import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function Admin({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container">
        <div className="admin-error">
          <h2>Access Denied</h2>
          <p>Only administrators can access this page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="container">Loading admin panel...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>Admin Dashboard</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>👥 Total Users</h3>
            <p className="stat-number">{stats?.totalUsers || 0}</p>
          </div>
          <div className="stat-card">
            <h3>📦 Total Products</h3>
            <p className="stat-number">{stats?.totalProducts || 0}</p>
          </div>
          <div className="stat-card">
            <h3>🛒 Total Orders</h3>
            <p className="stat-number">{stats?.totalOrders || 0}</p>
          </div>
          <div className="stat-card">
            <h3>💰 Total Revenue</h3>
            <p className="stat-number">₹{stats?.totalRevenue?.toFixed(2) || 0}</p>
          </div>
        </div>

        <div className="admin-sections">
          <div className="admin-section">
            <h2>Recent Orders</h2>
            <div className="table-responsive">
              {stats?.recentOrders?.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map(order => (
                      <tr key={order.order_id}>
                        <td>#{order.order_number}</td>
                        <td>{order.username}</td>
                        <td>₹{order.final_amount}</td>
                        <td>
                          <span className={`status-badge ${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No recent orders</p>
              )}
            </div>
          </div>

          <div className="admin-section">
            <h2>Top Selling Products</h2>
            <div className="products-list">
              {stats?.topProducts?.map(product => (
                <div key={product.product_id} className="product-row">
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.category_name}</p>
                  </div>
                  <div className="product-stats">
                    <span>Sold: {product.total_sold}</span>
                    <span>₹{product.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;