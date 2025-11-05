import React, { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally send the data to your backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="container">
      <div className="contact-page">
        <h1>Contact Us</h1>
        <p className="contact-subtitle">Have a question? We'd love to hear from you!</p>

        <div className="contact-layout">
          <div className="contact-info">
            <h3>Get In Touch</h3>
            
            <div className="contact-item">
              <h4>📍 Address</h4>
              <p>123 Market Street<br />Patna, Bihar 800001<br />India</p>
            </div>

            <div className="contact-item">
              <h4>📞 Phone</h4>
              <p>+91 9876543210</p>
            </div>

            <div className="contact-item">
              <h4>📧 Email</h4>
              <p>support@greenmarket.com</p>
            </div>

            <div className="contact-item">
              <h4>🕒 Business Hours</h4>
              <p>Monday - Saturday: 9:00 AM - 6:00 PM<br />Sunday: Closed</p>
            </div>

            <div className="social-links">
              <h4>Follow Us</h4>
              <div className="social-icons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">📘</a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">🐦</a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">📷</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">💼</a>
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <h3>Send us a Message</h3>
            
            {submitted && (
              <div className="success-message">
                Thank you for your message! We'll get back to you soon.
              </div>
            )}

            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your Name"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="What is this about?"
              />
            </div>

            <div className="form-group">
              <label>Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Your message..."
              />
            </div>

            <button type="submit" className="btn btn-success">
              Send Message
            </button>
          </form>
        </div>

        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>What are your delivery timings?</h4>
              <p>We deliver between 8 AM to 8 PM, Monday to Saturday.</p>
            </div>
            <div className="faq-item">
              <h4>Do you deliver on Sundays?</h4>
              <p>Currently, we don't deliver on Sundays. Orders placed on Saturday will be delivered on Monday.</p>
            </div>
            <div className="faq-item">
              <h4>What is your return policy?</h4>
              <p>We offer a 100% satisfaction guarantee. If you're not happy with the quality, contact us within 24 hours.</p>
            </div>
            <div className="faq-item">
              <h4>Are all products organic?</h4>
              <p>Yes, all our products are sourced from certified organic farms.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;