export function createEmptySet() {
  return {
    id: crypto.randomUUID(),

    type: "Working Set",

    plannedWeight: "",
    targetReps: "",

    actualWeight: "",
    actualReps: ""
  };
}

export function createWorkoutDay({
  name = "Day 1",
  mode = "straight",
  amrapDurationMinutes = 20,
  exercises = [],
} = {}) {
  return {
    id: crypto.randomUUID(),
    name,
    mode: mode === "amrap" ? "amrap" : "straight",
    amrapDurationMinutes:
      Number.isFinite(Number(amrapDurationMinutes)) &&
      Number(amrapDurationMinutes) > 0
        ? Number(amrapDurationMinutes)
        : 20,
    exercises,
  };
}

export function isAmrapDay(day) {
  return String(day?.mode || "").toLowerCase() === "amrap";
}

export function getAmrapDurationMinutes(day) {
  const mins = Number(day?.amrapDurationMinutes);
  return Number.isFinite(mins) && mins > 0 ? mins : 20;
}

export function createExercise(name = "New Exercise") {
  return {
    id: crypto.randomUUID(),

    name,

    remarks: "",

    sets: [createEmptySet()]
  };
}

export function createWorkoutEntry({
  date,
  routineName = "",
  workoutType = "",
  duration = ""
}) {
  return {
    id: crypto.randomUUID(),

    saveKey: date,
    date,

    type: "workout",

    routineName,
    workoutType,

    duration,

    createdAt: Date.now(),

    exercises: []
  };
}

export function createRestEntry(date) {
  return {
    id: crypto.randomUUID(),

    saveKey: date,
    date,

    type: "rest",

    createdAt: Date.now(),
  };
}

export function parseDurationToSeconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (!value || typeof value !== "string") return 0;

  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

export function formatDurationSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getEntryDurationSeconds(entry) {
  if (!entry) return 0;
  if (Number.isFinite(Number(entry.durationSeconds))) {
    return Math.max(0, Math.floor(Number(entry.durationSeconds)));
  }
  return parseDurationToSeconds(entry.duration);
}

export function createStretchEntry(
  date,
  { name = "", notes = "", duration = "", durationSeconds = 0 } = {}
) {
  const seconds = getEntryDurationSeconds({ duration, durationSeconds });

  return {
    id: crypto.randomUUID(),

    saveKey: date,
    date,

    type: "stretch",

    name: String(name || "").trim(),
    notes,
    duration: duration || formatDurationSeconds(seconds),
    durationSeconds: seconds,

    createdAt: Date.now(),
  };
}

const STRETCH_NAMES_KEY = "stretch-routine-names";

export function loadStretchRoutineNames() {
  try {
    const saved = localStorage.getItem(STRETCH_NAMES_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed)
      ? parsed
          .map((name) => String(name || "").trim())
          .filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function rememberStretchRoutineName(name, existing = loadStretchRoutineNames()) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return existing;

  const next = [
    trimmed,
    ...existing.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    ),
  ].slice(0, 20);

  localStorage.setItem(STRETCH_NAMES_KEY, JSON.stringify(next));
  return next;
}

export function isStretchEntry(entry) {
  return entry?.type === "stretch";
}

export function isRestEntry(entry) {
  return entry?.type === "rest";
}

export function isSessionEntry(entry) {
  return Boolean(entry) && !isStretchEntry(entry) && !isRestEntry(entry);
}

/** Group history so a day can hold a session (or rest) plus stretch. */
export function groupHistoryByDate(history = []) {
  const byDate = {};

  for (const entry of history) {
    const key = entry?.saveKey;
    if (!key) continue;

    if (!byDate[key]) {
      byDate[key] = { session: null, rest: null, stretch: null };
    }

    if (isStretchEntry(entry)) {
      byDate[key].stretch = entry;
    } else if (isRestEntry(entry)) {
      byDate[key].rest = entry;
    } else {
      byDate[key].session = entry;
    }
  }

  return byDate;
}

/** Upsert workout/rest for a date without removing stretch. */
export function upsertDaySession(history, entry) {
  const dateKey = entry.saveKey;

  return [
    entry,
    ...(history || []).filter(
      (item) =>
        !(
          item.saveKey === dateKey &&
          (isSessionEntry(item) || isRestEntry(item))
        )
    ),
  ];
}

/** Upsert stretch for a date without removing workout/rest. */
export function upsertDayStretch(history, entry) {
  const dateKey = entry.saveKey;

  return [
    entry,
    ...(history || []).filter(
      (item) => !(item.saveKey === dateKey && isStretchEntry(item))
    ),
  ];
}