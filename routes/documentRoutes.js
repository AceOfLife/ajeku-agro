const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/documentController');
const { authenticate } = require('../middlewares/authMiddleware');
const { upload } = require('../config/multerConfig'); // Destructure the pre-configured middleware

// Use the pre-configured upload middleware directly
router.post('/upload', 
  authenticate,
  upload, // No .array() needed - it's already configured
  DocumentController.uploadDocuments
);

module.exports = router;