import {
  getEntryDurationSeconds,
  groupHistoryByDate,
  isRestEntry,
  isSessionEntry,
  isStretchEntry,
} from "./schema";

export const ANALYTICS_PERIODS = [
  { id: "7", label: "7D", days: 7 },
  { id: "30", label: "30D", days: 30 },
  { id: "90", label: "90D", days: 90 },
  { id: "month", label: "Month", days: null },
];

export function getTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(dateKey, delta) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return getTodayKey(date);
}

function daysBetween(a, b) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const start = Date.UTC(ay, am - 1, ad);
  const end = Date.UTC(by, bm - 1, bd);
  return Math.round((end - start) / 86400000);
}

export function getPeriodRange(periodId, todayKey = getTodayKey()) {
  const [y, m] = todayKey.split("-").map(Number);

  if (periodId === "month") {
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    return { start, end: todayKey, label: "This month" };
  }

  const period = ANALYTICS_PERIODS.find((p) => p.id === periodId) || ANALYTICS_PERIODS[1];
  const days = period.days || 30;
  return {
    start: addDays(todayKey, -(days - 1)),
    end: todayKey,
    label: `Last ${days} days`,
  };
}

export function parseNumericWeight(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/[a-zA-Z]/.test(raw) && !/^\d/.test(raw)) return null;
  const match = raw.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

export function parseReps(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value).match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function setScore(set) {
  const weight = parseNumericWeight(set?.actualWeight ?? set?.plannedWeight);
  const reps = parseReps(set?.actualReps ?? set?.targetReps) || 0;
  if (weight === null) return -1;
  return weight * 1000 + reps;
}

function estimatedOneRm(weight, reps) {
  if (weight === null || !reps || reps <= 0) return null;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function classifyDayType(entry) {
  const label = String(
    entry?.workoutType || entry?.day || entry?.routineName || ""
  ).toLowerCase();
  if (/\bpull\b/.test(label)) return "Pull";
  if (/\blegs?\b|\blower\b/.test(label)) return "Legs";
  if (/\bpush\b|\bchest\b/.test(label)) return "Push";
  if (/\bupper\b/.test(label)) return "Upper";
  if (/\bfull\b/.test(label)) return "Full";
  return "Other";
}

function longestStreakWithGrace(activeFlags, maxGap = 1) {
  let best = 0;
  let current = 0;
  let gap = 0;

  for (const active of activeFlags) {
    if (active) {
      current += 1;
      gap = 0;
      if (current > best) best = current;
      continue;
    }
    gap += 1;
    if (gap > maxGap) current = 0;
  }
  return best;
}

function currentStreakWithGrace(activeFlags, maxGap = 1) {
  let streak = 0;
  let gap = 0;
  let started = false;

  for (let i = activeFlags.length - 1; i >= 0; i -= 1) {
    if (activeFlags[i]) {
      started = true;
      streak += 1;
      gap = 0;
      continue;
    }
    if (!started) continue;
    gap += 1;
    if (gap > maxGap) break;
  }
  return streak;
}

function eachDateKey(start, end) {
  const keys = [];
  let cursor = start;
  while (cursor <= end) {
    keys.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return keys;
}

function weekLabel(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  const mon = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return mon;
}

/**
 * Compute review analytics for a history window.
 */
export function computeAnalytics(history = [], periodId = "30") {
  const todayKey = getTodayKey();
  const range = getPeriodRange(periodId, todayKey);
  const priorDays = Math.max(1, daysBetween(range.start, range.end) + 1);
  const priorStart = addDays(range.start, -priorDays);
  const priorEnd = addDays(range.start, -1);

  const byDate = groupHistoryByDate(history);
  const dateKeys = eachDateKey(range.start, range.end);
  const priorKeys = eachDateKey(priorStart, priorEnd);

  const sessions = [];
  const rests = [];
  const stretches = [];
  const workoutFlags = [];

  for (const key of dateKeys) {
    const bucket = byDate[key];
    const hasWorkout = Boolean(bucket?.session);
    workoutFlags.push(hasWorkout);
    if (bucket?.session) sessions.push(bucket.session);
    if (bucket?.rest) rests.push(bucket.rest);
    if (bucket?.stretch) stretches.push(bucket.stretch);
  }

  let priorSessions = 0;
  for (const key of priorKeys) {
    if (byDate[key]?.session) priorSessions += 1;
  }

  let totalSeconds = 0;
  let totalVolume = 0;
  let totalSets = 0;
  let workingSets = 0;
  let setsHitTarget = 0;
  let setsCompared = 0;
  let bandSets = 0;
  const split = { Push: 0, Pull: 0, Legs: 0, Upper: 0, Full: 0, Other: 0 };
  const exerciseMap = new Map();

  for (const session of sessions) {
    totalSeconds += getEntryDurationSeconds(session);
    split[classifyDayType(session)] += 1;

    for (const exercise of session.exercises || []) {
      const name = String(exercise?.name || "").trim() || "Exercise";
      if (!exerciseMap.has(name)) {
        exerciseMap.set(name, { name, bestScore: -1, bestSet: null, points: [], sessions: 0 });
      }
      const track = exerciseMap.get(name);
      track.sessions += 1;

      let sessionBest = null;
      let sessionBestScore = -1;

      for (const set of exercise.sets || []) {
        totalSets += 1;
        const type = String(set?.type || "");
        const isWorking =
          /working|amrap/i.test(type) || (!/warm|ramp/i.test(type) && type !== "");
        if (isWorking) workingSets += 1;

        const weight = parseNumericWeight(set?.actualWeight);
        const plannedWeight = parseNumericWeight(
          set?.plannedWeight ?? set?.weight
        );
        const reps = parseReps(set?.actualReps);
        const targetReps = parseReps(set?.targetReps ?? set?.reps);

        if (weight === null && String(set?.actualWeight || "").trim()) {
          bandSets += 1;
        }

        if (weight !== null && reps !== null && reps > 0) {
          totalVolume += weight * reps;
        }

        if (reps !== null && targetReps !== null) {
          setsCompared += 1;
          if (reps >= targetReps) setsHitTarget += 1;
        } else if (
          weight !== null &&
          plannedWeight !== null &&
          weight >= plannedWeight &&
          (reps === null || targetReps === null)
        ) {
          setsCompared += 1;
          setsHitTarget += 1;
        }

        const score = setScore(set);
        if (score > sessionBestScore) {
          sessionBestScore = score;
          sessionBest = set;
        }
      }

      if (sessionBest && sessionBestScore >= 0) {
        const w = parseNumericWeight(sessionBest.actualWeight);
        const r = parseReps(sessionBest.actualReps) || 0;
        track.points.push({
          date: session.saveKey,
          weight: w,
          reps: r,
          label: w !== null ? `${w}×${r}` : `${sessionBest.actualWeight || "-"}×${sessionBest.actualReps || "-"}`,
          e1rm: estimatedOneRm(w, r),
        });
        if (sessionBestScore > track.bestScore) {
          track.bestScore = sessionBestScore;
          track.bestSet = {
            weight: w,
            reps: r,
            label:
              w !== null
                ? `${w} × ${r}`
                : `${sessionBest.actualWeight || "-"} × ${sessionBest.actualReps || "-"}`,
            date: session.saveKey,
          };
        }
      }
    }
  }

  const weeksMap = new Map();
  for (const key of dateKeys) {
    const label = weekLabel(key);
    if (!weeksMap.has(label)) {
      weeksMap.set(label, { label, sessions: 0, volume: 0, stretch: 0 });
    }
    const row = weeksMap.get(label);
    const bucket = byDate[key];
    if (bucket?.session) {
      row.sessions += 1;
      for (const exercise of bucket.session.exercises || []) {
        for (const set of exercise.sets || []) {
          const w = parseNumericWeight(set?.actualWeight);
          const r = parseReps(set?.actualReps);
          if (w !== null && r !== null) row.volume += w * r;
        }
      }
    }
    if (bucket?.stretch) row.stretch += 1;
  }

  const weeklyBars = [...weeksMap.values()];

  const topLifts = [...exerciseMap.values()]
    .filter((e) => e.points.some((p) => p.weight !== null))
    .sort((a, b) => b.sessions - a.sessions || b.bestScore - a.bestScore)
    .slice(0, 6)
    .map((e) => {
      const numericPoints = e.points.filter((p) => p.weight !== null);
      const first = numericPoints[0];
      const last = numericPoints[numericPoints.length - 1];
      const delta =
        first && last && first.weight !== null && last.weight !== null
          ? last.weight - first.weight
          : 0;
      return {
        name: e.name,
        bestSet: e.bestSet,
        sessions: e.sessions,
        delta,
        points: numericPoints.map((p) => ({
          date: p.date.slice(5),
          weight: p.weight,
          e1rm: p.e1rm,
          label: p.label,
        })),
      };
    });

  const prs = topLifts
    .filter((lift) => lift.bestSet)
    .map((lift) => ({
      name: lift.name,
      ...lift.bestSet,
    }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);

  const weeksInRange = Math.max(priorDays / 7, 1);
  const sessionsPerWeek = sessions.length / weeksInRange;
  const priorPerWeek = priorSessions / weeksInRange;
  const hitRate =
    setsCompared > 0 ? Math.round((setsHitTarget / setsCompared) * 100) : null;

  const insights = buildInsights({
    sessions,
    priorSessions,
    sessionsPerWeek,
    priorPerWeek,
    split,
    hitRate,
    topLifts,
    rests,
    stretches,
    currentStreak: currentStreakWithGrace(workoutFlags, 1),
  });

  return {
    range,
    periodId,
    sessions: sessions.length,
    rest: rests.length,
    stretch: stretches.length,
    priorSessions,
    sessionsDelta: sessions.length - priorSessions,
    sessionsPerWeek: Number(sessionsPerWeek.toFixed(1)),
    currentStreak: currentStreakWithGrace(workoutFlags, 1),
    longestStreak: longestStreakWithGrace(workoutFlags, 1),
    totalSeconds,
    avgSeconds: sessions.length ? Math.round(totalSeconds / sessions.length) : 0,
    totalVolume: Math.round(totalVolume),
    totalSets,
    workingSets,
    bandSets,
    hitRate,
    split,
    weeklyBars,
    topLifts,
    prs,
    insights,
  };
}

function buildInsights({
  sessions,
  priorSessions,
  sessionsPerWeek,
  priorPerWeek,
  split,
  hitRate,
  topLifts,
  rests,
  stretches,
  currentStreak,
}) {
  const lines = [];

  if (sessions.length === 0) {
    lines.push("No workouts logged in this period yet.");
    if (stretches.length > 0) {
      lines.push(`${stretches.length} stretch session${stretches.length === 1 ? "" : "s"} logged.`);
    }
    return lines.slice(0, 3);
  }

  const delta = sessions.length - priorSessions;
  if (delta > 0) {
    lines.push(`${delta} more workout${delta === 1 ? "" : "s"} than the previous period.`);
  } else if (delta < 0) {
    lines.push(`${Math.abs(delta)} fewer workout${Math.abs(delta) === 1 ? "" : "s"} than the previous period.`);
  } else {
    lines.push(`Same workout count as the previous period (${sessions.length}).`);
  }

  const push = split.Push || 0;
  const pull = split.Pull || 0;
  const legs = split.Legs || 0;
  if (pull >= push * 2 && pull > 1) {
    lines.push(`Pull days outnumber Push (${pull} vs ${push}).`);
  } else if (push >= pull * 2 && push > 1) {
    lines.push(`Push days outnumber Pull (${push} vs ${pull}).`);
  } else if (legs === 0 && sessions.length >= 3) {
    lines.push("No Legs sessions logged in this window.");
  } else if (Math.max(push, pull, legs) > 0) {
    lines.push(`Split: ${push} Push · ${pull} Pull · ${legs} Legs.`);
  }

  const gaining = topLifts.find((l) => l.delta > 0);
  if (gaining) {
    lines.push(
      `${gaining.name} best weight ${gaining.delta > 0 ? "+" : ""}${gaining.delta} kg this period.`
    );
  }

  if (hitRate !== null) {
    if (hitRate >= 80) {
      lines.push(`Hit ${hitRate}% of target reps — strong adherence.`);
    } else if (hitRate < 55) {
      lines.push(`Only ${hitRate}% of sets hit target reps — review loads.`);
    }
  }

  if (currentStreak >= 3) {
    lines.push(`Workout streak: ${currentStreak} days (with 1-day grace).`);
  }

  if (rests.length === 0 && sessions.length >= 5) {
    lines.push("No rest days logged — consider deliberate recovery.");
  }

  if (sessionsPerWeek >= 0 && priorPerWeek >= 0 && lines.length < 3) {
    lines.push(`Averaging ${sessionsPerWeek.toFixed(1)} sessions / week.`);
  }

  return lines.slice(0, 3);
}
