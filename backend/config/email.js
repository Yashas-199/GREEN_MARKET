const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection
if (process.env.EMAIL_USER) {
  transporter.verify((error, success) => {
    if (error) {
      console.log('⚠️  Email service not configured:', error.message);
    } else {
      console.log('✅ Email service ready');
    }
  });
}

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER) {
      console.log('Email not configured - skipping email to:', to);
      return null;
    }

    const info = await transporter.sendMail({
      from: `"Green Market" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('📧 Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    return null;
  }
};

module.exports = { sendEmail, transporter };