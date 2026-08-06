import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import sharp from "sharp";

const R2_BUCKET = process.env.R2_BUCKET || "alsadek";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-233449cd95484981a46fd69460d65453.r2.dev";
const SIZES = [400, 800, 1200];

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

// Uploads the original + 3 resized WebP variants (EXIF auto-rotated).
// Returns the base public URL (no size suffix) — the frontend's custom
// image loader (src/lib/r2-loader.js) appends "_400/_800/_1200.webp" per request.
export async function uploadImage(buffer, contentType, folder = "alsadek") {
  const R2 = getClient();
  const id = randomBytes(12).toString("hex");
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const baseKey = `${folder}/${id}`;
  const originalKey = `${baseKey}.${ext}`;

  await R2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: originalKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));

  await Promise.all(
    SIZES.map(async (size) => {
      const webp = await sharp(buffer)
        .rotate()
        .resize(size, undefined, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      await R2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: `${baseKey}_${size}.webp`,
        Body: webp,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }));
    })
  );

  return { url: `${R2_PUBLIC_URL}/${originalKey}`, key: originalKey };
}

export async function deleteImage(key) {
  const R2 = getClient();
  const baseKey = key.replace(/\.[^.]+$/, "");
  await Promise.allSettled([
    R2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })),
    ...SIZES.map((size) =>
      R2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: `${baseKey}_${size}.webp` }))
    ),
  ]);
}
