import { v2 as cloudinary } from "cloudinary";

export function getCloudinaryConfig() {
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
}

cloudinary.config(getCloudinaryConfig());

export default cloudinary;

export function isCloudinaryConfigured(): boolean {
  const cfg = getCloudinaryConfig();
  return !!(cfg.cloud_name && cfg.api_key && cfg.api_secret);
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<{ url: string; publicId: string }> {
  const cfg = getCloudinaryConfig();
  if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
    throw new Error("Cloudinary belum dikonfigurasi lengkap (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET)");
  }
  // re-configure lazily so env changes picked up on next call
  cloudinary.config(cfg);

  const cleanPublicId = filename
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 100);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `edubimbel/${folder}`,
        public_id: cleanPublicId,
        resource_type: resourceType,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          console.error("[Cloudinary upload error]", error);
          return reject(error ?? new Error("Upload gagal, tidak ada response dari Cloudinary"));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.on("error", (err) => {
      console.error("[Cloudinary stream error]", err);
      reject(err);
    });
    stream.end(buffer);
  });
}
