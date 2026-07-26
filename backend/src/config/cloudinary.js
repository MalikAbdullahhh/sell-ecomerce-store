import { v2 as cloudinary } from "cloudinary";

function trimEnv(value) {
  if (value == null) return "";
  return String(value).trim().replace(/^["']|["']$/g, "");
}

/**
 * Resolve credentials from discrete vars (preferred) or CLOUDINARY_URL
 * (cloudinary://API_KEY:API_SECRET@CLOUD_NAME).
 * Discrete vars win when all three are set — avoids stale CLOUDINARY_URL on Vercel
 * overriding a newly updated key/secret pair.
 */
function resolveCloudinaryConfig() {
  const cloud_name = trimEnv(
    process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  );
  const api_key = trimEnv(process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY);
  const api_secret = trimEnv(
    process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET,
  );

  if (cloud_name && api_key && api_secret) {
    let folder = trimEnv(process.env.CLOUDINARY_FOLDER) || "aperture";
    // Common mistake: pasting cloud name into CLOUDINARY_FOLDER
    if (folder === cloud_name) {
      console.warn(
        `[cloudinary] CLOUDINARY_FOLDER was set to the cloud name ("${folder}"). Using "aperture" instead.`,
      );
      folder = "aperture";
    }
    return { cloud_name, api_key, api_secret, folder };
  }

  const url = trimEnv(process.env.CLOUDINARY_URL);
  if (url.startsWith("cloudinary://")) {
    try {
      const parsed = new URL(url);
      const name = parsed.hostname;
      let folder = trimEnv(process.env.CLOUDINARY_FOLDER) || "aperture";
      if (folder === name) folder = "aperture";
      return {
        cloud_name: name,
        api_key: decodeURIComponent(parsed.username),
        api_secret: decodeURIComponent(parsed.password),
        folder,
      };
    } catch {
      // fall through
    }
  }

  return {
    cloud_name,
    api_key,
    api_secret,
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
    keyHint: creds.api_key ? `${creds.api_key.slice(0, 4)}…${creds.api_key.slice(-3)}` : null,
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
        `Cloudinary Console → Settings → API Keys → enable Upload/Create on this key ` +
        `(or create a new full-access key). Update backend Vercel env and redeploy.`,
    );
  }

  if (/invalid signature/i.test(detail) || /invalid signature/i.test(raw)) {
    return new Error(
      `Cloudinary Invalid Signature (401). The API Key and API Secret on the backend Vercel project ` +
        `do not match (or a stale CLOUDINARY_URL is overriding them). ` +
        `Copy Key + Secret from the SAME row in Cloudinary → API Keys, set CLOUDINARY_CLOUD_NAME / ` +
        `CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET, remove CLOUDINARY_URL if present, then Redeploy. ` +
        `Also set CLOUDINARY_FOLDER to a media folder name (e.g. gadgetsgoodpk), NOT the cloud name.`,
    );
  }

  if (http === 403 || /status code - 403/i.test(raw)) {
    return new Error(
      `Cloudinary upload forbidden (403). Key may lack Upload/Create permission, or credentials mismatch. (${detail})`,
    );
  }

  if (http === 401 || /status code - 401/i.test(raw)) {
    return new Error(
      `Cloudinary authentication failed (401). Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the backend Vercel project (must be the matching pair). (${detail})`,
    );
  }

  return err instanceof Error ? err : new Error(detail);
}

/**
 * Upload a Multer memory file (buffer) to Cloudinary.
 * Keep signed params minimal — boolean flags (overwrite/use_filename) have caused
 * Invalid Signature mismatches with some SDK/API combinations.
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
    resource_type: "auto",
  };
  if (publicId) options.public_id = publicId;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, async (err, result) => {
      if (!err) return resolve(result);

      const http = err?.http_code || err?.statusCode;
      if (http === 403 || /status code - 403/i.test(err?.message || "")) {
        try {
          const detail = await probeCloudinaryForbidden(file, options.folder);
          return reject(
            formatCloudinaryError({
              ...err,
              error: { message: detail },
              message: detail,
              http_code: 403,
            }),
          );
        } catch {
          return reject(formatCloudinaryError(err));
        }
      }
      return reject(formatCloudinaryError(err));
    });
    stream.end(file.buffer);
  });
}

async function probeCloudinaryForbidden(file, folder) {
  const auth = Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString("base64");
  const form = new FormData();
  form.append(
    "file",
    new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" }),
    file.originalname || "upload.bin",
  );
  if (folder) form.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${creds.cloud_name}/auto/upload`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: form,
  });
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
