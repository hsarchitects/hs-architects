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

/** Uploads a buffer and resolves to the delivered (https) URL. */
export function uploadBuffer(buffer: Buffer, filename?: string) {
  const client = getCloudinary();
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: "image",
        // Let Cloudinary pick the best format and quality per request.
        use_filename: Boolean(filename),
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}
