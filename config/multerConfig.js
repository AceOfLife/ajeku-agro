const multer = require('multer');
const cloudinary = require('./cloudinaryConfig'); // Import Cloudinary configuration

console.log('Cloudinary:', cloudinary);  // Log to check if cloudinary is correctly imported

const storage = multer.memoryStorage(); // Store the file in memory instead of disk
const upload = multer({ storage: storage }).array('images', 15); // Upload up to 15 files with the field name 'images'

async function uploadImagesToCloudinary(files) {
    const uploadPromises = files.map(file =>
        new Promise((resolve, reject) => {
            // Log to check if cloudinary.uploader is available
            console.log('Cloudinary uploader:', cloudinary.uploader);

            const stream = cloudinary.uploader.upload_stream(
                { folder: 'farm_images' }, 
                (error, result) => {
                    if (error) {
                        reject(error); // Reject the promise if an error occurs
                    } else {
                        resolve(result.secure_url); // Resolve with the secure URL of the uploaded image
                    }
                }
            );
            
            stream.end(file.buffer); // End the stream with the image buffer
        })
    );

    return Promise.all(uploadPromises);
}

module.exports = { upload, uploadImagesToCloudinary };
