import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>🌱 Green Market</h3>
          <p>Fresh Farm Products Direct to Your Door</p>
          <p className="tagline">Connecting farmers with consumers for a healthier tomorrow</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Customer Service</h4>
          <ul>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/shipping">Shipping Policy</Link></li>
            <li><Link to="/returns">Returns & Refunds</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Us</h4>
          <ul className="contact-info">
            <li>📧 Email: support@greenmarket.com</li>
            <li>📞 Phone: +91 9876543210</li>
            <li>📍 Address: 123 Market Street, Patna, Bihar 800001</li>
            <li>🕒 Mon-Sat: 9AM - 6PM</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <span className="social-icon">📘</span> Facebook
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <span className="social-icon">🐦</span> Twitter
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <span className="social-icon">📷</span> Instagram
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <span className="social-icon">💼</span> LinkedIn
            </a>
          </div>
          <div className="newsletter">
            <h5>Subscribe to Newsletter</h5>
            <input type="email" placeholder="Your email" />
            <button className="btn btn-primary">Subscribe</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 Green Market. All rights reserved.</p>
        <p>Made with ❤️ for farmers and consumers</p>
      </div>
    </footer>
  );
}

export default Footer;