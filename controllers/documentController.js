const { UserDocument, Client, User, sequelize } = require('../models');
// const { uploadImagesToCloudinary } = require('../utils/cloudinary');
const {uploadImagesToCloudinary} = require('../config/multerConfig');

exports.uploadDocuments = async (req, res) => {
  try {
    const { documentType } = req.body;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No documents uploaded' 
      });
    }

    // Upload to Cloudinary
    const uploadedUrls = await uploadImagesToCloudinary(req.files);
    
    // Create document record
    const document = await UserDocument.create({
      userId,
      documentType,
      frontUrl: uploadedUrls[0],
      backUrl: uploadedUrls[1] || null,
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Documents uploaded successfully',
      document: {
        id: document.id,
        type: document.documentType,
        frontUrl: document.frontUrl,
        backUrl: document.backUrl,
        status: document.status
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Document upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.verifyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, adminNotes } = req.body;

    // Match EXACTLY what's in your database enum (uppercase)
    const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    
    // Convert input to uppercase to match enum
    const statusUpperCase = status.toUpperCase();
    
    if (!allowedStatuses.includes(statusUpperCase)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }

    const document = await UserDocument.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Update using the uppercase status
    await document.update({
      status: statusUpperCase,  // Must be 'APPROVED' or 'REJECTED'
      adminNotes: adminNotes || null,
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    });

    return res.json({
      success: true,
      message: `Document ${statusUpperCase}`,
      document: {
        id: document.id,
        status: document.status,
        verifiedBy: document.verifiedBy,
        verifiedAt: document.verifiedAt
      }
    });

  } catch (error) {
    console.error('Admin document verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};   // 10/07/2025 revert here (Came back here after request to remove user verification)

