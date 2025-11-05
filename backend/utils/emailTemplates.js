const orderConfirmationEmail = (order, user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 Green Market</h1>
          <p>Order Confirmation</p>
        </div>
        <div class="content">
          <h2>Hi ${user.username}!</h2>
          <p>Thank you for your order. We've received it and will process it soon.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p><strong>Total Amount:</strong> ₹${order.final_amount}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <a href="${process.env.FRONTEND_URL}/order-tracking/${order.order_id}" class="button">
            Track Your Order
          </a>
          
          <p>You can track your order status anytime from your dashboard.</p>
        </div>
        <div class="footer">
          <p>© 2025 Green Market. All rights reserved.</p>
          <p>Fresh Farm Products Direct to Your Door</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const orderStatusUpdateEmail = (order, user, newStatus) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; padding: 10px 20px; background: #10b981; color: white; border-radius: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 Green Market</h1>
          <p>Order Status Update</p>
        </div>
        <div class="content">
          <h2>Hi ${user.username}!</h2>
          <p>Your order <strong>#${order.order_number}</strong> status has been updated.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span class="status-badge">${newStatus}</span>
          </div>
          
          <p>Total Amount: ₹${order.final_amount}</p>
          <p>You can track your order for more details.</p>
        </div>
        <div class="footer">
          <p>© 2025 Green Market. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  orderConfirmationEmail,
  orderStatusUpdateEmail
};