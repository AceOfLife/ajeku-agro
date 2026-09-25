const {
  uploadImagesToCloudinary,
  deleteImagesFromCloudinary,
} = require('../config/upload');

exports.uploadProductImages = async (files) => uploadImagesToCloudinary(files);
exports.deleteProductImages = async (publicIds) => deleteImagesFromCloudinary(publicIds);