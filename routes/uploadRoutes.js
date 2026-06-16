// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multerConfig = require('../config/multerConfig');

router.post('/upload-images', multerConfig.upload, async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  try {
    const imageUrls = await multerConfig.uploadImagesToCloudinary(req.files);
    res.status(200).json({ message: 'Images uploaded successfully', imageUrls });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Failed to upload images', error: error.message });
  }
});

router.post('/upload-documents', multerConfig.uploadDocuments, async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No documents uploaded' });
  }

  try {
    const documentUrls = await multerConfig.uploadDocumentsToCloudinary(req.files);
    res.status(200).json({ message: 'Documents uploaded successfully', documentUrls });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ message: 'Failed to upload documents', error: error.message });
  }
});

module.exports = router;