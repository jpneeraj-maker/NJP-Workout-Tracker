import { supabase } from "./supabaseClient";
import { EXERCISE_IMAGE_BUCKET } from "./exerciseImageUpload";
import { normalizeExerciseName } from "./exerciseImages";
import { upsertRepoEntry } from "./exerciseCatalog";

function slugToName(slug) {
  return String(slug || "")
    .replace(/\.jpe?g$/i, "")
    .replace(/^\d+-/, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function publicUrlForPath(path) {
  const { data } = supabase.storage
    .from(EXERCISE_IMAGE_BUCKET)
    .getPublicUrl(path);
  return data?.publicUrl || null;
}

/** List exercise image uploads; newest wins per exercise-name slug. */
export async function listLatestExerciseImagesFromStorage() {
  const { data, error } = await supabase.storage
    .from(EXERCISE_IMAGE_BUCKET)
    .list("exercises", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    console.warn("Could not list exercise images", error);
    return [];
  }

  const byKey = new Map();
  for (const file of data || []) {
    const label = slugToName(file.name);
    const key = normalizeExerciseName(label);
    if (!key || key === "exercise") continue;
    if (byKey.has(key)) continue;
    const path = `exercises/${file.name}`;
    const url = publicUrlForPath(path);
    if (!url) continue;
    byKey.set(key, {
      key,
      name: label.replace(/\b\w/g, (c) => c.toUpperCase()),
      path,
      url,
      createdAt: file.created_at,
    });
  }

  return [...byKey.values()];
}

/**
 * Attach newest Storage images onto matching program exercises + repo entries.
 */
export async function attachLatestStorageImages(program) {
  if (!program?.routines) return program;

  const images = await listLatestExerciseImagesFromStorage();
  if (!images.length) return program;

  let next = JSON.parse(JSON.stringify(program));
  const byKey = new Map(
    images.map((item) => [item.key, item])
  );

  const routines = Array.isArray(next.routines)
    ? next.routines
    : Object.values(next.routines || {});

  for (const routine of routines) {
    for (const day of routine?.days || []) {
      for (const exercise of day?.exercises || []) {
        const key = normalizeExerciseName(exercise?.name);
        const match = byKey.get(key);
        if (!match) continue;
        exercise.image = match.url;
      }
    }
  }

  for (const item of images) {
    next = upsertRepoEntry(next, {
      name: item.name,
      image: item.url,
    });
  }

  return next;
}
