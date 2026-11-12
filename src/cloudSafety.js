/** Prevent accidental cloud overwrites while recovering lost program data. */
export const CLOUD_WRITE_FREEZE_KEY = "workout-cloud-write-frozen";
export const LAST_GOOD_META_KEY = "workout-last-good-cloud-meta";
export const LOCAL_BACKUP_INDEX_KEY = "workout-local-backup-index";
export const LOCAL_BACKUP_PREFIX = "workout-local-backup:";
const MAX_LOCAL_BACKUPS = 10;

/** Block cloud writes that shrink the program this much vs last known good. */
export const RICHNESS_DROP_RATIO = 0.7;
export const RICHNESS_DROP_ABSOLUTE = 10;

export function isCloudWriteFrozen() {
  try {
    const raw = localStorage.getItem(CLOUD_WRITE_FREEZE_KEY);
    // Default ON after the wipe incident until explicitly unfrozen.
    if (raw === null || raw === undefined || raw === "") return true;
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

export function setCloudWriteFrozen(frozen) {
  try {
    localStorage.setItem(CLOUD_WRITE_FREEZE_KEY, frozen ? "1" : "0");
  } catch {
    // ignore
  }
}

export function ensureCloudWriteFrozenByDefault() {
  try {
    if (localStorage.getItem(CLOUD_WRITE_FREEZE_KEY) === null) {
      localStorage.setItem(CLOUD_WRITE_FREEZE_KEY, "1");
    }
  } catch {
    // ignore
  }
}

export function countProgramExercises(program) {
  const routines = program?.routines || program?.weeks || {};
  const list = Array.isArray(routines)
    ? routines
    : Object.values(routines || {});
  return list.reduce((total, routine) => {
    const days = Array.isArray(routine?.days)
      ? routine.days
      : Object.values(routine?.days || {});
    return (
      total +
      days.reduce((n, day) => n + (day?.exercises?.length || 0), 0)
    );
  }, 0);
}

export function getLastGoodCloudMeta() {
  try {
    const raw = localStorage.getItem(LAST_GOOD_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      exerciseCount: Number(parsed.exerciseCount) || 0,
      historyLength: Number(parsed.historyLength) || 0,
      savedAt: parsed.savedAt || null,
    };
  } catch {
    return null;
  }
}

export function rememberGoodCloudMeta({ exerciseCount, historyLength }) {
  try {
    const count = Number(exerciseCount) || 0;
    if (count <= 0) return;
    const prev = getLastGoodCloudMeta();
    // Only ratchet upward for exercise count so a thin save can't lower the bar.
    const nextCount = Math.max(prev?.exerciseCount || 0, count);
    localStorage.setItem(
      LAST_GOOD_META_KEY,
      JSON.stringify({
        exerciseCount: nextCount,
        historyLength: Math.max(
          prev?.historyLength || 0,
          Number(historyLength) || 0
        ),
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    // ignore
  }
}

/**
 * Decide whether a cloud write is safe.
 * Autosave should hard-block; manual upload may pass force:true after confirm.
 */
export function evaluateCloudWriteSafety({
  program,
  history,
  force = false,
} = {}) {
  const exerciseCount = countProgramExercises(program);
  const historyLength = Array.isArray(history) ? history.length : 0;
  const lastGood = getLastGoodCloudMeta();
  const lastCount = lastGood?.exerciseCount || 0;

  if (exerciseCount <= 0) {
    return {
      ok: false,
      reason: "empty_program",
      message:
        "Refusing cloud write: program has 0 exercises (empty shell).",
      exerciseCount,
      historyLength,
      lastCount,
    };
  }

  if (
    !force &&
    lastCount > 0 &&
    exerciseCount < lastCount * RICHNESS_DROP_RATIO &&
    lastCount - exerciseCount >= RICHNESS_DROP_ABSOLUTE
  ) {
    return {
      ok: false,
      reason: "richness_regression",
      message: `Refusing cloud write: program shrank from ${lastCount} → ${exerciseCount} exercises. Export a backup and confirm overwrite if intentional.`,
      exerciseCount,
      historyLength,
      lastCount,
    };
  }

  return {
    ok: true,
    reason: "ok",
    message: "",
    exerciseCount,
    historyLength,
    lastCount,
  };
}

function readBackupIndex() {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBackupIndex(index) {
  localStorage.setItem(LOCAL_BACKUP_INDEX_KEY, JSON.stringify(index));
}

/** Snapshot full backup payload locally before risky cloud writes. */
export function saveLocalRollingBackup(payload, label = "auto") {
  try {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const key = `${LOCAL_BACKUP_PREFIX}${id}`;
    const exerciseCount = countProgramExercises(
      payload?.workoutPlans || payload?.data?.workoutPlans || payload
    );
    const historyLength = Array.isArray(payload?.workoutHistory)
      ? payload.workoutHistory.length
      : Array.isArray(payload?.data?.workoutHistory)
        ? payload.data.workoutHistory.length
        : 0;

    const record = {
      id,
      key,
      label,
      savedAt: new Date().toISOString(),
      exerciseCount,
      historyLength,
    };

    localStorage.setItem(key, JSON.stringify(payload));

    const nextIndex = [record, ...readBackupIndex().filter((r) => r.id !== id)];
    while (nextIndex.length > MAX_LOCAL_BACKUPS) {
      const dropped = nextIndex.pop();
      try {
        if (dropped?.key) localStorage.removeItem(dropped.key);
      } catch {
        // ignore
      }
    }
    writeBackupIndex(nextIndex);
    return record;
  } catch (err) {
    console.warn("Local rolling backup failed", err);
    return null;
  }
}

export function listLocalRollingBackups() {
  return readBackupIndex();
}

export function loadLocalRollingBackup(id) {
  try {
    const meta = readBackupIndex().find((r) => r.id === id);
    if (!meta?.key) return null;
    const raw = localStorage.getItem(meta.key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** True when a backup payload looks like a usable restore (not an empty shell). */
export function isBackupPayloadRich(payload) {
  const plans = payload?.workoutPlans;
  const history = payload?.workoutHistory;
  if (!plans || !Array.isArray(history)) return false;
  return countProgramExercises(plans) > 0;
}

function historyEntryKey(entry) {
  if (!entry || typeof entry !== "object") return "";
  if (entry.id != null && String(entry.id)) return `id:${entry.id}`;
  const saveKey = String(entry.saveKey || "");
  const kind = entry.type || entry.workoutType || entry.day || "";
  const created = entry.createdAt || entry.duration || "";
  const exCount = Array.isArray(entry.exercises)
    ? entry.exercises.length
    : Array.isArray(entry.circuit)
      ? entry.circuit.length
      : 0;
  return `sk:${saveKey}|k:${kind}|c:${created}|n:${exCount}`;
}

/**
 * Merge cloud + local history without dropping either side's sessions.
 * Prefer the entry that has more exercise/circuit detail when keys collide.
 */
export function mergeWorkoutHistories(...lists) {
  const map = new Map();

  const score = (entry) => {
    const exercises = Array.isArray(entry?.exercises)
      ? entry.exercises.length
      : 0;
    const circuit = Array.isArray(entry?.circuit) ? entry.circuit.length : 0;
    const named = String(entry?.routineName || "").trim() ? 1 : 0;
    return exercises * 10 + circuit * 10 + named;
  };

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      const key = historyEntryKey(entry);
      if (!key) continue;
      const prev = map.get(key);
      if (!prev || score(entry) >= score(prev)) {
        map.set(key, entry);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Best-effort append to workout_data_snapshots.
 * Safe if the table does not exist yet — errors are swallowed.
 */
export async function appendCloudSnapshot(supabase, {
  userId = "default-user",
  payload,
  exerciseCount,
  historyLength,
  source = "autosave",
} = {}) {
  if (!supabase) return { ok: false, skipped: true };
  try {
    const { error } = await supabase.from("workout_data_snapshots").insert({
      user_id: userId,
      exercise_count: exerciseCount ?? countProgramExercises(payload?.workoutPlans),
      history_length:
        historyLength ??
        (Array.isArray(payload?.workoutHistory)
          ? payload.workoutHistory.length
          : 0),
      source,
      data: payload,
      created_at: new Date().toISOString(),
    });
    if (error) {
      // Table may not exist yet — non-fatal.
      console.warn("Cloud snapshot append skipped/failed", error.message || error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    console.warn("Cloud snapshot append error", err);
    return { ok: false, error: err };
  }
}
