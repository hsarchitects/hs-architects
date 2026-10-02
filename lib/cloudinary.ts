import "server-only";
import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary is configured lazily for the same reason the Mongo client is:
 * configuring (and validating credentials) at module scope would run during
 * `next build`, which must work on a machine with no credentials.
 */

export const CLOUDINARY_FOLDER = "hs-architects";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;

    if (!cloud_name || !api_key || !api_secret) {
      throw new Error(
        "Cloudinary is not configured — set CLOUDINARY_CLOUD_NAME, " +
          "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local."
      );
    }

    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    configured = true;
  }
  return cloudinary;
}

/**
 * Signs one direct browser → Cloudinary upload. The file itself never passes
 * through this server, so it isn't bound by a serverless host's request-body
 * limit (4.5MB on Vercel). Everything in `params` is covered by the signature
 * — the browser must send it unchanged, so it can't pick another folder or
 * file type.
 */
export function signUpload() {
  const client = getCloudinary();
  const { cloud_name, api_key, api_secret } = client.config();
  const params = {
    allowed_formats: "jpg,png,webp,gif",
    folder: CLOUDINARY_FOLDER,
    timestamp: Math.round(Date.now() / 1000),
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    fields: {
      ...params,
      api_key: api_key!,
      signature: client.utils.api_sign_request(params, api_secret!),
    },
  };
}
