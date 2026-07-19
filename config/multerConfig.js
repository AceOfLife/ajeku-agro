// config/multerConfig.js
const multer = require('multer');
const cloudinary = require('./cloudinaryConfig');

const storage = multer.memoryStorage();

// Custom file filter to log what's coming in
const fileFilter = (req, file, cb) => {
    console.log('=== MULTER DEBUG ===');
    console.log('Field name:', file.fieldname);
    console.log('Original name:', file.originalname);
    console.log('Mimetype:', file.mimetype);
    console.log('All fields in req.body:', Object.keys(req.body));
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 15
    },
    fileFilter: fileFilter
}).fields([
    { name: 'units', maxCount: 1 },
    { name: 'images', maxCount: 15 }
]);

async function uploadImagesToCloudinary(files) {
    if (!files || files.length === 0) {
        return [];
    }

    const uploadPromises = files.map(file =>
        new Promise((resolve, reject) => {
            try {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'farm_images' },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result.secure_url);
                        }
                    }
                );
                stream.end(file.buffer);
            } catch (error) {
                reject(error);
            }
        })
    );

    return Promise.all(uploadPromises);
}

module.exports = { upload, uploadImagesToCloudinary };