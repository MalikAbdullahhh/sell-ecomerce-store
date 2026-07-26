import { v2 as cloudinary } from "cloudinary";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER = "aperture",
} = process.env;

export const cloudinaryEnabled = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET,
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function cloudinaryFolder(...parts) {
  return [CLOUDINARY_FOLDER, ...parts].filter(Boolean).join("/");
}

/**
 * Upload a Multer memory file (buffer) to Cloudinary.
 * Uses resource_type "auto" so images and videos both work.
 */
export function uploadBufferToCloudinary(file, { folder, publicId } = {}) {
  if (!cloudinaryEnabled) {
    return Promise.reject(new Error("Cloudinary is not configured"));
  }
  if (!file?.buffer) {
    return Promise.reject(new Error("Missing file buffer for Cloudinary upload"));
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder || CLOUDINARY_FOLDER,
        public_id: publicId,
        resource_type: "auto",
        overwrite: false,
        unique_filename: true,
        use_filename: true,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
    stream.end(file.buffer);
  });
}

export { cloudinary };
