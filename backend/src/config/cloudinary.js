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
  const detail = err?.error?.message || raw;

  if (
    /missing permissions|actions=\["create"\]/i.test(detail) ||
    /missing permissions|actions=\["create"\]/i.test(raw)
  ) {
    return new Error(
      `Cloudinary API key cannot upload (missing "create" permission). ` +
        `Cloudinary Console → Settings → API Keys → open this key → enable Upload/Create ` +
        `(or create a new full-access API key). Then update CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET ` +
        `on the backend Vercel project and redeploy.`,
    );
  }

  // Bare "403" from the SDK almost always means restricted key permissions or wrong secret.
  if (http === 403 || /status code - 403/i.test(raw)) {
    return new Error(
      `Cloudinary upload forbidden (403). Your API key is likely missing Upload/Create permission, ` +
        `or the key/secret/cloud name do not match. ` +
        `Fix in Cloudinary → Settings → API Keys, set env vars on the backend Vercel project, redeploy. ` +
        `(${detail})`,
    );
  }

  if (http === 401 || /status code - 401/i.test(raw)) {
    return new Error(
      `Cloudinary authentication failed (401). Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the backend Vercel project.`,
    );
  }

  return err instanceof Error ? err : new Error(detail);
}

/**
 * Upload a Multer memory file (buffer) to Cloudinary.
 * Uses resource_type "auto" so images and videos both work.
 * On 403, retries once via REST to capture X-Cld-Error for clearer messaging.
 */
export function uploadBufferToCloudinary(file, { folder, publicId } = {}) {
  if (!cloudinaryEnabled) {
    return Promise.reject(new Error("Cloudinary is not configured"));
  }
  if (!file?.buffer) {
    return Promise.reject(new Error("Missing file buffer for Cloudinary upload"));
  }

  const options = {
    folder: folder || CLOUDINARY_FOLDER,
    public_id: publicId,
    resource_type: "auto",
    overwrite: false,
    unique_filename: true,
    use_filename: false,
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, async (err, result) => {
      if (!err) return resolve(result);

      const http = err?.http_code || err?.statusCode;
      if (http === 403 || /status code - 403/i.test(err?.message || "")) {
        try {
          const detail = await probeCloudinaryForbidden(file);
          return reject(formatCloudinaryError({ ...err, error: { message: detail }, message: detail, http_code: 403 }));
        } catch {
          return reject(formatCloudinaryError(err));
        }
      }
      return reject(formatCloudinaryError(err));
    });
    stream.end(file.buffer);
  });
}

/** Hit Upload API directly to read X-Cld-Error (SDK often strips it). */
async function probeCloudinaryForbidden(file) {
  const auth = Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString("base64");
  const form = new FormData();
  form.append(
    "file",
    new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" }),
    file.originalname || "upload.bin",
  );
  form.append("folder", CLOUDINARY_FOLDER);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${creds.cloud_name}/auto/upload`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${auth}` },
      body: form,
    },
  );
  const headerErr = res.headers.get("x-cld-error");
  let bodyMsg = "";
  try {
    const json = await res.json();
    bodyMsg = json?.error?.message || "";
  } catch {
    /* ignore */
  }
  return headerErr || bodyMsg || `HTTP ${res.status}`;
}

export { cloudinary };
