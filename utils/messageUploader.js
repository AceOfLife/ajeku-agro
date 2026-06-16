// utils/messageUploader.js
const cloudinary = require('../config/cloudinaryConfig');

/**
 * Upload media files to Cloudinary for messages
 */
async function uploadMessageMediaToCloudinary(file, folder = 'message_media') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: folder,
        resource_type: 'auto'
      }, 
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type
          });
        }
      }
    );
    
    stream.end(file.buffer);
  });
}

/**
 * Determine media type from mimetype
 */
function getMediaType(mimetype) {
  const typeMap = {
    'image/jpeg': 'image',
    'image/jpg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'application/pdf': 'pdf',
    'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    'text/plain': 'document',
    'application/zip': 'document',
    'application/vnd.rar': 'document'
  };

  return typeMap[mimetype] || 'other';
}

module.exports = { uploadMessageMediaToCloudinary, getMediaType };