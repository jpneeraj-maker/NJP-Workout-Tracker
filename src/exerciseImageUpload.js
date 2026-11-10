import { supabase } from "./supabaseClient";

export const EXERCISE_IMAGE_BUCKET = "exercise-images";

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not compress image"));
        else resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function compressImageFile(
  file,
  { maxWidth = 900, maxHeight = 900, quality = 0.82 } = {}
) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = objectUrl;
    });

    const scale = Math.min(
      1,
      maxWidth / image.width,
      maxHeight / image.height
    );
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image");
    ctx.drawImage(image, 0, 0, width, height);

    return canvasToBlob(canvas, "image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function getStoragePathFromPublicUrl(url) {
  if (!url || typeof url !== "string") return null;
  const marker = `/object/public/${EXERCISE_IMAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

export async function ensureExerciseImageBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) return;

  const exists = (buckets || []).some(
    (bucket) => bucket.name === EXERCISE_IMAGE_BUCKET
  );
  if (exists) return;

  await supabase.storage.createBucket(EXERCISE_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
}

export async function uploadExerciseImage(file, meta = {}) {
  await ensureExerciseImageBucket();

  const blob = await compressImageFile(file);
  const safeName = String(meta.name || "exercise")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const path = `exercises/${Date.now()}-${safeName || "exercise"}.jpg`;

  const { error } = await supabase.storage
    .from(EXERCISE_IMAGE_BUCKET)
    .upload(path, blob, {
      contentType: "image/jpeg",
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(
      error.message?.includes("Bucket not found")
        ? `Storage bucket "${EXERCISE_IMAGE_BUCKET}" not found. Create a public bucket with that name in Supabase Storage.`
        : error.message || "Upload failed"
    );
  }

  const { data } = supabase.storage
    .from(EXERCISE_IMAGE_BUCKET)
    .getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Upload succeeded but no public URL was returned");
  }

  return { url: data.publicUrl, path };
}

export async function deleteExerciseImageByUrl(url) {
  const path = getStoragePathFromPublicUrl(url);
  if (!path) return;

  const { error } = await supabase.storage
    .from(EXERCISE_IMAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.warn("Could not delete previous exercise image", error);
  }
}
