import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

const configureCloudinary = () => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });
};

const uploadOnCloudinary = async (input) => {
    configureCloudinary();

    // If input is a string, treat it as a file path
    if (typeof input === 'string') {
        const result = await cloudinary.uploader.upload(input, {
            resource_type: "image",
            folder: "virtual_assistant_images",
        });
        return result.secure_url;
    }

    // Otherwise treat it as a Buffer
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { 
                resource_type: "image",
                folder: "virtual_assistant_images",
                format: "jpg"
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Stream Error:", error);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );
        stream.end(input);
    });
};

export default uploadOnCloudinary;