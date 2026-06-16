const transporter = require('./mailer'); // Import the transporter from mailer.js

// Function to send an email
const sendEmail = async (to, subject, text) => {
  try {
    // Set up email data
    const mailOptions = {
      from: 'teddyogbonnaya@gmail.com',  // Sender address
      to,  // Receiver address
      subject,  // Subject of the email
      text,  // Plain text content
    };

    // Send email using the transporter
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;  // Optionally handle errors or log
  }
};

module.exports = sendEmail;
