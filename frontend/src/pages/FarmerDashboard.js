import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/FarmerDashboard.css'; 

function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
    description: '',
    price: '',
    quantity: '',
    unit: 'kg',
    image_url: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Categories state updated:', categories);
  }, [categories]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // Fetch categories (always needed, no auth required)
    try {
      const categoriesRes = await axios.get('http://localhost:5000/api/products/categories/all');
      console.log('Categories loaded:', categoriesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage({ type: 'error', text: 'Failed to load categories' });
    }

    // Fetch farmer's products
    try {
      const productsRes = await axios.get(
        `http://localhost:5000/api/products/farmer/${user.user_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }

    // Fetch orders for farmer's products
    try {
      const ordersRes = await axios.get(
        `http://localhost:5000/api/farmer/orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMessage({ type: 'error', text: 'Failed to load orders' });
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      const productData = {
        ...formData,
        farmer_id: user.user_id
      };

      if (editingProduct) {
        // Update existing product
        await axios.put(
          `http://localhost:5000/api/products/${editingProduct.product_id}`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({ type: 'success', text: 'Product updated successfully!' });
      } else {
        // Create new product
        await axios.post(
          'http://localhost:5000/api/products',
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({ type: 'success', text: 'Product added successfully!' });
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save product' });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      category_id: product.category_id,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      unit: product.unit || 'kg',
      image_url: product.image_url || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Product deleted successfully!' });
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage({ type: 'error', text: 'Failed to delete product' });
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: '',
      category_id: '',
      description: '',
      price: '',
      quantity: '',
      unit: 'kg',
      image_url: ''
    });
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/farmer/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Order status updated successfully!' });
      fetchData(); // Refresh orders
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Failed to update order status' });
    }
  };

  const getOrderStatusBadge = (status) => {
    const statusColors = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-info',
      packed: 'badge-info',
      shipped: 'badge-primary',
      out_for_delivery: 'badge-primary',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    };
    return `badge ${statusColors[status] || 'badge-secondary'}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="farmer-dashboard">
      <div className="page-container">
        <div className="page-header">
          <h1>🚜 Farmer Dashboard</h1>
          <p>Manage your products and orders</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
            <button onClick={() => setMessage({ type: '', text: '' })} className="alert-close">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 My Products ({products.length})
          </button>
          <button
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            🛒 Orders Received ({orders.length})
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header flex justify-between align-center">
                <h2>My Products</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingProduct(null);
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  ➕ Add New Product
                </button>
              </div>

              {products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <h3>No Products Yet</h3>
                  <p>Start by adding your first product</p>
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    Add Product
                  </button>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.product_id}>
                          <td>
                            <div className="product-cell">
                              <img
                                src={product.image_url || 'https://via.placeholder.com/50'}
                                alt={product.product_name}
                                className="product-image"
                              />
                              <div>
                                <div className="product-name">{product.product_name}</div>
                                <div className="product-description">{product.description?.substring(0, 50)}...</div>
                              </div>
                            </div>
                          </td>
                          <td>{product.category_name}</td>
                          <td>₹{product.price}/{product.unit}</td>
                          <td>{product.quantity} {product.unit}</td>
                          <td>
                            <span className={product.is_active ? 'badge badge-success' : 'badge badge-secondary'}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEdit(product)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(product.product_id)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h2>Orders Received</h2>
                <p>Manage orders from your customers</p>
              </div>

              {orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🛒</div>
                  <h3>No Orders Yet</h3>
                  <p>Orders for your products will appear here</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.order_id} className="order-card">
                      <div className="order-card-header">
                        <div>
                          <h3>Order #{order.order_number}</h3>
                          <p className="order-date">
                            {new Date(order.order_date).toLocaleDateString()} at{' '}
                            {new Date(order.order_date).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className={getOrderStatusBadge(order.status)}>
                          {order.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="order-customer-info">
                        <h4>Customer Details:</h4>
                        <div className="customer-details">
                          <p><strong>Name:</strong> {order.customer_name}</p>
                          <p><strong>Phone:</strong> {order.customer_phone}</p>
                          <p><strong>Email:</strong> {order.customer_email}</p>
                          <p><strong>Address:</strong> {order.delivery_address || order.customer_address}</p>
                        </div>
                      </div>

                      <div className="order-items">
                        <h4>Products Ordered:</h4>
                        {order.items && order.items.map(item => (
                          <div key={item.order_item_id} className="order-item">
                            {item.image_url && (
                              <img 
                                src={`http://localhost:5000${item.image_url}`} 
                                alt={item.product_name}
                                className="order-item-image"
                              />
                            )}
                            <div className="order-item-details">
                              <p className="order-item-name">{item.product_name}</p>
                              <p className="order-item-qty">Quantity: {item.quantity}</p>
                            </div>
                            <div className="order-item-price">
                              ₹{item.total_price}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-footer">
                        <div className="order-total">
                          <strong>Total Amount:</strong> ₹{order.final_amount}
                        </div>
                        <div className="order-actions">
                          <label>Update Status:</label>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.order_id, e.target.value)}
                            className="status-select"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    name="product_name"
                    className="form-input"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      name="category_id"
                      className="form-select"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories && categories.length > 0 ? (
                        categories.map(cat => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat.category_name}
                          </option>
                        ))
                      ) : (
                        <option disabled>Loading categories...</option>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit *</label>
                    <select
                      name="unit"
                      className="form-select"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="kg">Kilogram (kg)</option>
                      <option value="liter">Liter</option>
                      <option value="piece">Piece</option>
                      <option value="dozen">Dozen</option>
                      <option value="gram">Gram</option>
                      <option value="set">Set</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      className="form-input"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-input"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-textarea"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    name="image_url"
                    className="form-input"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmerDashboard;