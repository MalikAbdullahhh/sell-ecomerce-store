import { v2 as cloudinary } from "cloudinary";

function trimEnv(value) {
  if (value == null) return "";
  return String(value).trim().replace(/^["']|["']$/g, "");
}

/**
 * Resolve credentials from either discrete vars or CLOUDINARY_URL
 * (cloudinary://API_KEY:API_SECRET@CLOUD_NAME).
 * Also accepts common aliases (CLOUDINARY_NAME / KEY / SECRET).
 */
function resolveCloudinaryConfig() {
  const url = trimEnv(process.env.CLOUDINARY_URL);
  if (url.startsWith("cloudinary://")) {
    try {
      const parsed = new URL(url);
      return {
        cloud_name: parsed.hostname,
        api_key: decodeURIComponent(parsed.username),
        api_secret: decodeURIComponent(parsed.password),
        folder: trimEnv(process.env.CLOUDINARY_FOLDER) || "aperture",
      };
    } catch {
      // fall through to discrete vars
    }
  }

  return {
    cloud_name: trimEnv(
      process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
    ),
    api_key: trimEnv(process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY),
    api_secret: trimEnv(
      process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET,
    ),
    folder: trimEnv(process.env.CLOUDINARY_FOLDER) || "aperture",
  };
}

const creds = resolveCloudinaryConfig();

export const CLOUDINARY_FOLDER = creds.folder;

export const cloudinaryEnabled = Boolean(
  creds.cloud_name && creds.api_key && creds.api_secret,
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: creds.cloud_name,
    api_key: creds.api_key,
    api_secret: creds.api_secret,
    secure: true,
  });
}

export function cloudinaryFolder(...parts) {
  return [CLOUDINARY_FOLDER, ...parts].filter(Boolean).join("/");
}

export function cloudinaryPublicStatus() {
  return {
    enabled: cloudinaryEnabled,
    cloudName: cloudinaryEnabled ? creds.cloud_name : null,
    folder: CLOUDINARY_FOLDER,
    hasKey: Boolean(creds.api_key),
    hasSecret: Boolean(creds.api_secret),
  };
}

function formatCloudinaryError(err) {
  const http = err?.http_code || err?.statusCode || err?.status;
  const raw = err?.message || String(err);
  if (/missing permissions|actions=\["create"\]/i.test(raw)) {
    return new Error(
      `Cloudinary API key cannot upload (missing "create" permission). ` +
        `In Cloudinary Console → Settings → API Keys, open this key and enable Upload/Create, ` +
        `or create a new full-access key and update CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET on the backend Vercel project.`,
    );
  }
  if (http === 401 || http === 403 || /status code - 40[13]/i.test(raw)) {
    return new Error(
      `Cloudinary rejected the upload (${http || 403}). ` +
        `On the backend Vercel project, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET ` +
        `(or CLOUDINARY_URL) to values from Cloudinary → Settings → API Keys, then redeploy. Details: ${raw}`,
    );
  }
  return err instanceof Error ? err : new Error(raw);
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
        use_filename: false,
      },
      (err, result) => {
        if (err) return reject(formatCloudinaryError(err));
        resolve(result);
      },
    );
    stream.end(file.buffer);
  });
}

export { cloudinary };
