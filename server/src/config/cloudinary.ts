import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

// Ensure configuration is set with current environment variables
const initCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// Initialize on import
initCloudinary();

export default cloudinary;
