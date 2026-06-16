// config/cloudinaryConfig.js
const cloudinary = require('cloudinary').v2; // Import Cloudinary v2
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Configuring Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary; // Export the configured cloudinary instance
