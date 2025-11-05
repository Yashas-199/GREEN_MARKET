import React from 'react';

function About() {
  return (
    <div className="container">
      <div className="about-page">
        <h1>About Green Market</h1>
        
        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            Green Market is dedicated to connecting farmers directly with consumers, ensuring fresh, 
            organic produce reaches your doorstep while providing fair prices to our farming community.
          </p>
        </div>

        <div className="about-section">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🌱 100% Organic</h3>
              <p>All our products are sourced from certified organic farms</p>
            </div>
            <div className="feature-card">
              <h3>🚚 Fresh Delivery</h3>
              <p>Farm-to-door delivery within 24-48 hours</p>
            </div>
            <div className="feature-card">
              <h3>💰 Fair Prices</h3>
              <p>No middlemen means better prices for both farmers and consumers</p>
            </div>
            <div className="feature-card">
              <h3>🤝 Support Local</h3>
              <p>Directly support local farming communities</p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>Our Story</h2>
          <p>
            Founded in 2025, Green Market started with a simple vision: to bridge the gap between 
            farmers and consumers. We believe in sustainable agriculture, fair trade, and providing 
            healthy food options to families across India.
          </p>
          <p>
            Today, we work with over 100 farmers across Bihar and deliver fresh produce to thousands 
            of happy customers every day.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Values</h2>
          <ul className="values-list">
            <li>✅ Sustainability and environmental responsibility</li>
            <li>✅ Fair compensation for farmers</li>
            <li>✅ Quality and freshness guaranteed</li>
            <li>✅ Transparency in sourcing and pricing</li>
            <li>✅ Community support and development</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default About;