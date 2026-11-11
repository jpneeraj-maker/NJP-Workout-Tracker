import {
  getBundledExerciseNames,
  getExerciseImage,
  normalizeExerciseName,
} from "./exerciseImages";

const ABBREVIATIONS = {
  db: "dumbbell",
  dbs: "dumbbell",
  bb: "barbell",
  bw: "bodyweight",
  oh: "overhead",
  ohp: "overhead press",
  rdl: "romanian deadlift",
  rdls: "romanian deadlift",
  ez: "ezbar",
  lat: "lateral",
  amrap: "amrap",
};

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Mobility",
  "Other",
];

/** First matching rule wins — keep more specific groups earlier. */
const MUSCLE_GROUP_RULES = [
  {
    group: "Mobility",
    test: /\b(stretch|mobility|foam.?roll|dislocate|world.?s greatest)\b/i,
  },
  {
    group: "Core",
    test: /\b(plank|ab\b|core|crunch|rollout|leg.?raise|pallof|anti.?rotation)\b/i,
  },
  {
    group: "Arms",
    test: /\b(curl|bicep|tricep|skull.?crush|pushdown|farmer|wrist|overhead.?extension)\b/i,
  },
  {
    group: "Shoulders",
    test: /\b(shoulder|lateral.?raise|rear.?delt|overhead.?press|ohp|upright.?row|shrug|y.?raise)\b/i,
  },
  {
    group: "Chest",
    test: /\b(chest|bench|fly|flies|pec|push.?up)\b/i,
  },
  {
    group: "Legs",
    test: /\b(squat|lunge|hamstring|quad|glute|hip.?thrust|calf|rdl|romanian|deadlift|split.?squat|leg\b)\b/i,
  },
  {
    group: "Back",
    test: /\b(row|rows|pull.?up|chin.?up|lat\b|face.?pull|good.?morning|pulldown|pullover|back)\b/i,
  },
];

/** Infer primary muscle group from exercise name (repo override wins). */
export function inferMuscleGroup(name, explicitGroup) {
  const explicit = String(explicitGroup || "").trim();
  if (explicit && MUSCLE_GROUPS.includes(explicit)) return explicit;

  const label = String(name || "");
  // Order matters for overlapping terms (e.g. RDL / deadlift → Legs preferred in rules above Back if we check Legs first for those)
  for (const rule of MUSCLE_GROUP_RULES) {
    if (rule.test.test(label)) return rule.group;
  }
  return "Other";
}

export function groupCatalogByMuscle(catalog = []) {
  const buckets = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, []]));
  for (const item of catalog) {
    const group = item.muscleGroup || inferMuscleGroup(item.name);
    if (!buckets[group]) buckets[group] = [];
    buckets[group].push(item);
  }
  return MUSCLE_GROUPS.map((group) => ({
    group,
    items: buckets[group] || [],
  })).filter((section) => section.items.length > 0);
}

export function getRoutinesArray(dataOrRoutines) {
  const routines = dataOrRoutines?.routines ?? dataOrRoutines;
  if (!routines) return [];
  return Array.isArray(routines) ? routines : Object.values(routines);
}

export function ensureExerciseRepo(data) {
  const next = data && typeof data === "object" ? data : { routines: {} };
  if (!next.exerciseRepo || typeof next.exerciseRepo !== "object") {
    next.exerciseRepo = { entries: {}, hidden: {} };
  }
  if (
    !next.exerciseRepo.entries ||
    typeof next.exerciseRepo.entries !== "object"
  ) {
    next.exerciseRepo.entries = {};
  }
  if (
    !next.exerciseRepo.hidden ||
    typeof next.exerciseRepo.hidden !== "object"
  ) {
    next.exerciseRepo.hidden = {};
  }
  return next;
}

export function getHiddenExerciseKeys(data) {
  const hidden = ensureExerciseRepo(data).exerciseRepo.hidden || {};
  return new Set(
    Object.entries(hidden)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => normalizeExerciseName(key))
  );
}

export function getExerciseRepoEntries(data) {
  return ensureExerciseRepo(data).exerciseRepo.entries;
}

export function exerciseFingerprint(name) {
  return normalizeExerciseName(name)
    .replace(/[()[\],./+]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => ABBREVIATIONS[token] || token)
    .flatMap((token) => String(token).split(/\s+/))
    .filter(Boolean)
    .sort()
    .join(" ");
}

export function findRepoEntry(data, name) {
  const key = normalizeExerciseName(name);
  if (!key) return null;
  const entries = getExerciseRepoEntries(data);
  const fp = exerciseFingerprint(name);

  for (const entry of Object.values(entries)) {
    if (!entry) continue;
    const names = [entry.name, ...(entry.aliases || [])];
    if (names.some((n) => normalizeExerciseName(n) === key)) return entry;
    if (names.some((n) => exerciseFingerprint(n) === fp)) return entry;
  }
  return null;
}

export function resolveExerciseImage(exercise, data, options = {}) {
  if (exercise?.image) return exercise.image;
  const repoEntry = findRepoEntry(data, exercise?.name);
  if (repoEntry?.image) return repoEntry.image;
  return getExerciseImage(exercise, options);
}

function collectProgramExercises(data) {
  const byKey = new Map();

  getRoutinesArray(data).forEach((routine, routineIndex) => {
    (routine?.days || []).forEach((day, dayIndex) => {
      (day?.exercises || []).forEach((exercise, exerciseIndex) => {
        const name = String(exercise?.name || "").trim();
        if (!name) return;
        const key = normalizeExerciseName(name);
        if (!key) return;

        const existing = byKey.get(key) || {
          key,
          name,
          aliases: new Set(),
          count: 0,
          customImage: null,
          locations: [],
        };

        existing.count += 1;
        existing.locations.push({
          routineIndex,
          dayIndex,
          exerciseIndex,
          routineName: routine?.name || `Routine ${routineIndex + 1}`,
          dayName: day?.name || `Day ${dayIndex + 1}`,
        });
        if (exercise?.image && !existing.customImage) {
          existing.customImage = exercise.image;
        }
        byKey.set(key, existing);
      });
    });
  });

  return byKey;
}

/** Flat catalog for the Exercise Repo UI. */
export function buildExerciseCatalog(data) {
  const programMap = collectProgramExercises(data);
  const entries = getExerciseRepoEntries(data);
  const byKey = new Map();

  const upsert = ({
    key,
    name,
    aliases = [],
    image = null,
    count = 0,
    locations = [],
    source = "program",
    repoId = null,
    muscleGroup = null,
  }) => {
    if (!key) return;
    const prev = byKey.get(key) || {
      key,
      name,
      aliases: [],
      image: null,
      count: 0,
      locations: [],
      sources: new Set(),
      repoId: null,
      muscleGroup: null,
      similarGroup: exerciseFingerprint(name),
    };

    prev.name = name || prev.name;
    prev.aliases = [
      ...new Set(
        [...prev.aliases, ...aliases]
          .map((a) => String(a || "").trim())
          .filter((a) => a && normalizeExerciseName(a) !== key)
      ),
    ];
    if (image) prev.image = image;
    if (muscleGroup) prev.muscleGroup = muscleGroup;
    prev.count += count;
    prev.locations = [...prev.locations, ...locations];
    prev.sources.add(source);
    if (repoId) prev.repoId = repoId;
    prev.similarGroup = exerciseFingerprint(prev.name);
    byKey.set(key, prev);
  };

  for (const [key, item] of programMap.entries()) {
    upsert({
      key,
      name: item.name,
      count: item.count,
      locations: item.locations,
      image: item.customImage,
      source: "program",
    });
  }

  for (const [repoId, entry] of Object.entries(entries)) {
    if (!entry?.name) continue;
    const key = normalizeExerciseName(entry.name);
    upsert({
      key,
      name: entry.name,
      aliases: entry.aliases || [],
      image: entry.image || null,
      muscleGroup: entry.muscleGroup || null,
      source: "repo",
      repoId,
    });
  }

  const existingFingerprints = new Set(
    [...byKey.values()].map((item) => exerciseFingerprint(item.name))
  );

  for (const bundledName of getBundledExerciseNames()) {
    const key = normalizeExerciseName(bundledName);
    if (byKey.has(key)) continue;

    const fp = exerciseFingerprint(bundledName);
    if (existingFingerprints.has(fp)) {
      for (const item of byKey.values()) {
        if (exerciseFingerprint(item.name) !== fp) continue;
        if (normalizeExerciseName(bundledName) === item.key) break;
        item.aliases = [
          ...new Set([...(item.aliases || []), bundledName]),
        ];
        break;
      }
      continue;
    }

    upsert({
      key,
      name: bundledName,
      image: getExerciseImage({ name: bundledName }),
      source: "bundled",
    });
    existingFingerprints.add(fp);
  }

  // Fold repo aliases into matching catalog rows and drop duplicate alias keys.
  for (const entry of Object.values(entries)) {
    if (!entry?.name) continue;
    const canonicalKey = normalizeExerciseName(entry.name);
    const canonical = byKey.get(canonicalKey);
    if (!canonical) continue;
    for (const alias of entry.aliases || []) {
      const aliasKey = normalizeExerciseName(alias);
      if (!aliasKey || aliasKey === canonicalKey) continue;
      const aliasItem = byKey.get(aliasKey);
      if (aliasItem) {
        canonical.count += aliasItem.count || 0;
        canonical.locations = [
          ...(canonical.locations || []),
          ...(aliasItem.locations || []),
        ];
        if (aliasItem.image && !canonical.image) {
          canonical.image = aliasItem.image;
        }
        byKey.delete(aliasKey);
      }
      canonical.aliases = [
        ...new Set([...(canonical.aliases || []), alias]),
      ];
    }
  }

  const hiddenKeys = getHiddenExerciseKeys(data);

  const list = [...byKey.values()]
    .filter((item) => !hiddenKeys.has(item.key))
    .map((item) => {
      const repoEntry = findRepoEntry(data, item.name);
      const resolvedImage =
        item.image ||
        repoEntry?.image ||
        getExerciseImage({ name: item.name });
      const muscleGroup = inferMuscleGroup(
        item.name,
        item.muscleGroup || repoEntry?.muscleGroup
      );

      return {
        ...item,
        image: resolvedImage || null,
        muscleGroup,
        sources: [...item.sources],
        aliasCount: item.aliases.length,
      };
    });

  list.sort((a, b) => {
    const groupCmp =
      MUSCLE_GROUPS.indexOf(a.muscleGroup) -
      MUSCLE_GROUPS.indexOf(b.muscleGroup);
    if (groupCmp !== 0) return groupCmp;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  return list;
}

export function findSimilarCatalogGroups(catalog) {
  const groups = new Map();
  for (const item of catalog || []) {
    const fp = item.similarGroup || exerciseFingerprint(item.name);
    if (!fp) continue;
    if (!groups.has(fp)) groups.set(fp, []);
    groups.get(fp).push(item);
  }
  return [...groups.values()]
    .map((group) => {
      // Deduplicate by fingerprint key collision leftovers
      const seen = new Set();
      return group.filter((item) => {
        if (seen.has(item.key)) return false;
        seen.add(item.key);
        return true;
      });
    })
    .filter((group) => group.length > 1)
    .sort((a, b) => b.length - a.length);
}

export function findExistingCatalogMatch(data, name) {
  const key = normalizeExerciseName(name);
  if (!key || key === "new exercise") return null;

  const catalog = buildExerciseCatalog(data);
  const exact = catalog.find((item) => item.key === key);
  if (exact?.image) {
    return {
      name: exact.name,
      image: exact.image,
      reason: "exact",
    };
  }

  const fp = exerciseFingerprint(name);
  const similar = catalog.find(
    (item) => item.similarGroup === fp && item.image && item.key !== key
  );
  if (similar) {
    return {
      name: similar.name,
      image: similar.image,
      reason: "similar",
    };
  }

  const bundled = getExerciseImage({ name });
  if (bundled) {
    return { name: name.trim(), image: bundled, reason: "bundled" };
  }

  return null;
}

function forEachProgramExercise(data, fn) {
  getRoutinesArray(data).forEach((routine, routineIndex) => {
    (routine?.days || []).forEach((day, dayIndex) => {
      (day?.exercises || []).forEach((exercise, exerciseIndex) => {
        fn(exercise, { routineIndex, dayIndex, exerciseIndex, routine, day });
      });
    });
  });
}

function matchesNameSet(exerciseName, nameSet) {
  const key = normalizeExerciseName(exerciseName);
  const fp = exerciseFingerprint(exerciseName);
  return (
    nameSet.has(key) ||
    [...nameSet].some((n) => exerciseFingerprint(n) === fp)
  );
}

export function upsertRepoEntry(
  data,
  { name, aliases = [], image = undefined, muscleGroup = undefined }
) {
  const next = ensureExerciseRepo(JSON.parse(JSON.stringify(data)));
  const key = normalizeExerciseName(name);
  if (!key) return next;

  const entries = next.exerciseRepo.entries;
  const existing =
    Object.entries(entries).find(
      ([, entry]) => normalizeExerciseName(entry?.name) === key
    ) || null;

  const id = existing?.[0] || crypto.randomUUID();
  const prev = existing?.[1] || {
    name,
    aliases: [],
    image: null,
    muscleGroup: null,
  };

  entries[id] = {
    ...prev,
    name: String(name).trim(),
    aliases: [
      ...new Set(
        [...(prev.aliases || []), ...aliases]
          .map((a) => String(a || "").trim())
          .filter(
            (a) => a && normalizeExerciseName(a) !== normalizeExerciseName(name)
          )
      ),
    ],
    image:
      image === undefined
        ? prev.image || null
        : image || null,
    muscleGroup:
      muscleGroup === undefined
        ? prev.muscleGroup || inferMuscleGroup(name)
        : muscleGroup || inferMuscleGroup(name),
  };

  return next;
}

export function setRepoImageForName(data, name, imageUrl) {
  let next = upsertRepoEntry(data, { name, image: imageUrl || null });
  const names = new Set([
    normalizeExerciseName(name),
    ...(findRepoEntry(next, name)?.aliases || []).map(normalizeExerciseName),
  ]);

  forEachProgramExercise(next, (exercise) => {
    if (!matchesNameSet(exercise.name, names)) return;
    if (imageUrl) exercise.image = imageUrl;
    else delete exercise.image;
  });

  return next;
}

export function renameExerciseEverywhere(
  data,
  { fromNames, toName, keepAliases = true, image }
) {
  const next = ensureExerciseRepo(JSON.parse(JSON.stringify(data)));
  const target = String(toName || "").trim();
  if (!target) return next;

  const fromSet = new Set(
    (fromNames || [])
      .map((n) => normalizeExerciseName(n))
      .filter(Boolean)
  );
  if (!fromSet.size) return next;

  const targetKey = normalizeExerciseName(target);
  const aliasesToKeep = keepAliases
    ? [...fromSet].filter((n) => n !== targetKey)
    : [];

  // Merge/remove old repo entries
  const entries = next.exerciseRepo.entries;
  let keptImage = null;
  let keptMuscleGroup = null;
  const priorAliases = [];
  for (const [id, entry] of Object.entries(entries)) {
    const entryNames = [entry?.name, ...(entry?.aliases || [])].map(
      normalizeExerciseName
    );
    const overlaps =
      entryNames.some((n) => fromSet.has(n)) ||
      entryNames.some((n) =>
        [...fromSet].some((from) => exerciseFingerprint(from) === exerciseFingerprint(n))
      ) ||
      fromSet.has(normalizeExerciseName(entry?.name));
    if (!overlaps) continue;
    if (entry?.image && !keptImage) keptImage = entry.image;
    if (entry?.muscleGroup && !keptMuscleGroup) {
      keptMuscleGroup = entry.muscleGroup;
    }
    priorAliases.push(...(entry.aliases || []), entry?.name);
    delete entries[id];
  }

  const chosenImage =
    image === undefined ? keptImage : image || null;

  // Also match program exercises by fingerprint of any fromName
  const fromFingerprints = new Set(
    [...fromSet].map((n) => exerciseFingerprint(n)).filter(Boolean)
  );

  forEachProgramExercise(next, (exercise) => {
    const key = normalizeExerciseName(exercise.name);
    const fp = exerciseFingerprint(exercise.name);
    const match =
      fromSet.has(key) ||
      fromFingerprints.has(fp) ||
      matchesNameSet(exercise.name, fromSet);
    if (!match) return;
    exercise.name = target;
    if (image !== undefined) {
      if (chosenImage) exercise.image = chosenImage;
      else delete exercise.image;
    } else if (chosenImage && !exercise.image) {
      exercise.image = chosenImage;
    }
  });

  const readableAliases = [
    ...new Set(
      [...aliasesToKeep, ...priorAliases]
        .map((a) => String(a || "").trim())
        .filter(Boolean)
        .filter((a) => normalizeExerciseName(a) !== targetKey)
    ),
  ];

  // Un-hide canonical; hide old variants so they don't reappear from bundled defaults
  next.exerciseRepo.hidden = next.exerciseRepo.hidden || {};
  delete next.exerciseRepo.hidden[targetKey];
  for (const aliasKey of aliasesToKeep) {
    next.exerciseRepo.hidden[aliasKey] = true;
  }

  next.exerciseRepo.entries[crypto.randomUUID()] = {
    name: target,
    aliases: readableAliases,
    image: chosenImage,
    muscleGroup: keptMuscleGroup || inferMuscleGroup(target),
  };

  return next;
}

export function deleteRepoEntryByName(data, name) {
  const next = ensureExerciseRepo(JSON.parse(JSON.stringify(data)));
  const key = normalizeExerciseName(name);
  const entries = next.exerciseRepo.entries;

  for (const [id, entry] of Object.entries(entries)) {
    const names = [entry?.name, ...(entry?.aliases || [])].map(
      normalizeExerciseName
    );
    if (names.includes(key) || normalizeExerciseName(entry?.name) === key) {
      delete entries[id];
    }
  }
  return next;
}

/** Hide an exercise from the repo list (program data stays). */
export function hideExerciseFromRepo(data, name) {
  const next = deleteRepoEntryByName(data, name);
  const key = normalizeExerciseName(name);
  if (!key) return next;
  next.exerciseRepo.hidden = next.exerciseRepo.hidden || {};
  next.exerciseRepo.hidden[key] = true;
  return next;
}

export function removeExerciseNameFromProgram(data, name) {
  const next = JSON.parse(JSON.stringify(data));
  const key = normalizeExerciseName(name);

  getRoutinesArray(next).forEach((routine) => {
    (routine?.days || []).forEach((day) => {
      day.exercises = (day.exercises || []).filter(
        (ex) => normalizeExerciseName(ex?.name) !== key
      );
    });
  });

  return deleteRepoEntryByName(next, name);
}
