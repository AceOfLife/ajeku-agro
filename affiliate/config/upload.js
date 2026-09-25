const multer = require('multer');
const cloudinary = require('../../config/cloudinaryConfig');

const storage = multer.memoryStorage();

const multerInstance = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpe?g|png|webp)/i.test(file.mimetype);
    if (!ok) return cb(new Error('Only jpg, jpeg, png, webp images are allowed'));
    cb(null, true);
  },
});

// Export a callable middleware (Multer's .array() returns one)
const upload = multerInstance.array('images', 5);

const FOLDER = 'ajeku_affiliate/products';

async function uploadImagesToCloudinary(files = []) {
  if (!files.length) return [];

  const uploads = files.map(
    (file) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: FOLDER, resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        stream.end(file.buffer);
      })
  );

  return Promise.all(uploads);
}

async function deleteImagesFromCloudinary(publicIds = []) {
  if (!publicIds.length) return;
  await Promise.all(
    publicIds.map((id) =>
      cloudinary.uploader.destroy(id).catch(() => null)
    )
  );
}

module.exports = {
  upload,
  uploadImagesToCloudinary,
  deleteImagesFromCloudinary,
};