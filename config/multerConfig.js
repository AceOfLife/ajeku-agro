// config/multerConfig.js
const multer = require('multer');
const cloudinary = require('./cloudinaryConfig');

const storage = multer.memoryStorage();

// Use .any() to accept ALL fields (for debugging)
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 15
    }
}).any();  // ← Accepts ANY field name

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