// config/multerConfig.js
const multer = require('multer');
const cloudinary = require('./cloudinaryConfig');

const storage = multer.memoryStorage();

// Configure multer with file size limits
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 15 // Max 15 files
    }
}).array('images', 15);

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