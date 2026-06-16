const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport (configure your SMTP settings)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',  // Example: Using Mailtrap SMTP (for testing)
  port: 587,                 // Standard port for SMTP
  secure: false,             // Use true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,  // Replace with your email user (could be environment variable)
    pass: process.env.EMAIL_PASS   // Replace with your email password (could be environment variable)
  }
});

module.exports = transporter;
