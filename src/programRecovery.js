import { workoutData } from "./workoutData.js";
import mayBackup from "./backups/workout-backup-2026-05-11.json";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function workoutTimestamp(entry) {
  const parsed = Date.parse(entry?.createdAt || entry?.date || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function exercisesFromHistoryEntry(entry) {
  if (Array.isArray(entry?.exercises) && entry.exercises.length) {
    return entry.exercises;
  }
  if (Array.isArray(entry?.circuit) && entry.circuit.length) {
    return entry.circuit;
  }
  return [];
}

function sanitizeHistoryExercise(exercise) {
  return {
    name: String(exercise?.name || "Exercise").trim() || "Exercise",
    remarks: exercise?.remarks || "",
    ...(exercise?.loggingMode ? { loggingMode: exercise.loggingMode } : {}),
    ...(exercise?.image ? { image: exercise.image } : {}),
    sets: (exercise?.sets || []).map((set, index) => ({
      type: set?.type || `Working Set ${index + 1}`,
      plannedWeight:
        set?.plannedWeight || set?.actualWeight || set?.weight || "",
      targetReps: set?.targetReps || set?.actualReps || set?.reps || "",
      actualWeight: "",
      actualReps: "",
    })),
  };
}

function inferRecoveredRoutineName(weekKey, dayNames) {
  const joined = dayNames.join(" ").toLowerCase();
  if (joined.includes("full body")) return "No Equipment";
  if (/\b(push|pull|upper|lower|legs)\b/.test(joined)) return "PPL + UL";
  if (joined.includes("mobility") || joined.includes("stretch")) {
    return "Mobility";
  }
  return `Routine ${weekKey}`;
}

function overlayHistoryWeights(program, history = []) {
  if (!program?.routines || !Array.isArray(history) || !history.length) {
    return program;
  }

  const latestByExercise = new Map();
  const sorted = [...history].sort(
    (a, b) => workoutTimestamp(b) - workoutTimestamp(a)
  );

  for (const entry of sorted) {
    for (const exercise of exercisesFromHistoryEntry(entry)) {
      const key = normalizeName(exercise?.name);
      if (!key || latestByExercise.has(key)) continue;
      const sets = (exercise?.sets || [])
        .map((set) => ({
          plannedWeight:
            set?.actualWeight || set?.plannedWeight || set?.weight || "",
          targetReps: set?.actualReps || set?.targetReps || set?.reps || "",
        }))
        .filter((set) => set.plannedWeight || set.targetReps);
      if (!sets.length) continue;
      latestByExercise.set(key, sets);
    }
  }

  const next = clone(program);
  Object.values(next.routines || {}).forEach((routine) => {
    (routine?.days || []).forEach((day) => {
      (day?.exercises || []).forEach((exercise) => {
        const histSets = latestByExercise.get(normalizeName(exercise?.name));
        if (!histSets?.length || !Array.isArray(exercise.sets)) return;
        exercise.sets = exercise.sets.map((set, index) => {
          const hist = histSets[Math.min(index, histSets.length - 1)];
          if (!hist) return set;
          return {
            ...set,
            plannedWeight: hist.plannedWeight || set.plannedWeight || "",
            targetReps: hist.targetReps || set.targetReps || "",
          };
        });
      });
    });
  });

  return next;
}

/** Rebuild routines purely from completed workout history. */
export function rebuildProgramFromHistory(history = []) {
  if (!Array.isArray(history) || history.length === 0) return null;

  const routinesMap = new Map();

  for (const entry of history) {
    const isAmrap = String(entry?.type || "").toLowerCase() === "amrap";
    const rawExercises = exercisesFromHistoryEntry(entry);
    if (!rawExercises.length && !isAmrap) continue;

    const named = String(entry?.routineName || entry?.routine || "").trim();
    const weekKey =
      entry?.week !== undefined && entry?.week !== null
        ? String(entry.week)
        : "";
    let mapKey = "";
    let routineName = "";

    if (named) {
      mapKey = `name:${named}`;
      routineName = named;
    } else if (weekKey !== "") {
      mapKey = `week:${weekKey}`;
      routineName = `Routine ${weekKey}`;
    } else {
      continue;
    }

    const dayName =
      String(entry?.day || entry?.workoutType || "Day").trim() || "Day";
    const ts = workoutTimestamp(entry);
    if (!routinesMap.has(mapKey)) {
      routinesMap.set(mapKey, { name: routineName, days: new Map() });
    }
    const routine = routinesMap.get(mapKey);
    if (named) routine.name = named;

    const prev = routine.days.get(dayName);
    if (prev && ts < prev.ts) continue;

    routine.days.set(dayName, {
      ts,
      day: {
        name: dayName,
        mode: isAmrap ? "amrap" : "straight",
        ...(isAmrap
          ? {
              amrapDurationMinutes:
                entry?.durationMinutes ||
                entry?.amrapDurationMinutes ||
                20,
            }
          : {}),
        exercises: rawExercises.map(sanitizeHistoryExercise),
      },
    });
  }

  if (!routinesMap.size) return null;

  const mergedByName = new Map();
  for (const [mapKey, routine] of routinesMap.entries()) {
    const dayEntries = [...routine.days.values()];
    if (mapKey.startsWith("week:")) {
      routine.name = inferRecoveredRoutineName(
        mapKey.slice(5),
        dayEntries.map((d) => d.day.name)
      );
    }
    const nameKey = normalizeName(routine.name) || "routine";
    if (!mergedByName.has(nameKey)) {
      mergedByName.set(nameKey, { name: routine.name, days: new Map() });
    }
    const target = mergedByName.get(nameKey);
    for (const [dayName, dayInfo] of routine.days.entries()) {
      const prev = target.days.get(dayName);
      if (!prev || dayInfo.ts >= prev.ts) {
        target.days.set(dayName, dayInfo);
      }
    }
  }

  // Keep the most useful recent programs; drop tiny one-off leftovers.
  const preferred = [
    "amrap",
    "no equipment",
    "ppl ul",
    "ppl 5 day split",
    "ppl 5 day mobility",
    "ppl 6 day split",
  ];

  const sortedRoutines = [...mergedByName.values()]
    .filter((routine) => {
      const days = [...routine.days.values()];
      const exCount = days.reduce(
        (n, d) => n + (d.day?.exercises?.length || 0),
        0
      );
      const key = normalizeName(routine.name);
      if (preferred.some((p) => key.includes(p.replace(/\s+/g, " ")))) {
        return exCount > 0;
      }
      // Keep other named programs only if they look substantial.
      return days.length >= 2 && exCount >= 8;
    })
    .sort((a, b) => {
      const aMax = Math.max(0, ...[...a.days.values()].map((d) => d.ts));
      const bMax = Math.max(0, ...[...b.days.values()].map((d) => d.ts));
      return bMax - aMax;
    });

  const routines = {};
  sortedRoutines.forEach((routine, index) => {
    routines[String(index)] = {
      name: routine.name,
      days: sortDaysNatural(
        [...routine.days.values()].map((d) => d.day)
      ),
    };
  });

  return Object.keys(routines).length ? { routines } : null;
}

/** Push 1 / Day 1 before Push 2 / Day 2, etc. */
export function sortDaysNatural(days = []) {
  const typeRank = (name) => {
    const n = normalizeName(name);
    if (n.includes("push")) return 1;
    if (n.includes("pull")) return 2;
    if (n.includes("legs") || n.includes("lower")) return 3;
    if (n.includes("upper")) return 4;
    if (n.includes("full body")) return 5;
    if (n.includes("day")) return 6;
    return 9;
  };
  return [...days].sort((a, b) => {
    const an = normalizeName(a?.name);
    const bn = normalizeName(b?.name);
    const aNum = Number((an.match(/(\d+)/) || [])[1] || 0);
    const bNum = Number((bn.match(/(\d+)/) || [])[1] || 0);
    if (aNum !== bNum && (aNum || bNum)) return aNum - bNum;
    const tr = typeRank(an) - typeRank(bn);
    if (tr !== 0) return tr;
    return an.localeCompare(bn);
  });
}

function bareExercise(name, loggingMode) {
  return {
    name,
    remarks: "",
    ...(loggingMode ? { loggingMode } : {}),
    sets: [
      {
        type: "Working Set 1",
        plannedWeight: loggingMode === "band" ? "Red" : "-",
        targetReps: "10-15",
        actualWeight: "",
        actualReps: "",
      },
    ],
  };
}

/**
 * Rebuild travel + AMRAP shells from recent history and known day patterns.
 * Exact Day 3/4 prescriptions are unknown if never logged — use best-known moves.
 */
export function buildTravelAndAmrapRoutines(history = []) {
  const amrapFromHistory = rebuildProgramFromHistory(history);
  const amrap = Object.values(amrapFromHistory?.routines || {}).find(
    (routine) => normalizeName(routine?.name) === "amrap"
  );

  const day1 =
    amrap?.days?.find((d) => /day\s*1/i.test(d.name)) ||
    {
      name: "Day 1",
      mode: "amrap",
      amrapDurationMinutes: 20,
      exercises: [
        "Push Ups",
        "Squats",
        "Glute Bridges",
        "Bird Dogs",
        "Knee drives",
      ].map((name) => bareExercise(name, "bodyweight")),
    };

  const day2 =
    amrap?.days?.find((d) => /day\s*2/i.test(d.name)) ||
    {
      name: "Day 2",
      mode: "amrap",
      amrapDurationMinutes: 20,
      exercises: [
        "Pike Push-ups",
        "Alternating Lunges",
        "Single Leg Hip Hinge",
        "Prone W Raises",
        "Dead Bug",
      ].map((name) => bareExercise(name, "bodyweight")),
    };

  // Never logged in history — reconstructed from recent uploads / travel pattern.
  const day3 = {
    name: "Day 3",
    mode: "amrap",
    amrapDurationMinutes: 20,
    exercises: [
      "Close Grip Push Ups",
      "Reverse Lunges",
      "BW Good Mornings",
      "Plank Shoulder Taps",
      "Prone Reverse Snow Angels",
    ].map((name) => bareExercise(name, "bodyweight")),
  };

  const day4 = {
    name: "Day 4",
    mode: "amrap",
    amrapDurationMinutes: 20,
    exercises: [
      "Sumo Squat",
      "Single Leg Glute Bridge",
      "Swimmers",
      "Reverse Crunches",
      "Standing Cross Body Knee Drives",
    ].map((name) => bareExercise(name, "bodyweight")),
  };

  const noEquipFromHistory = Object.values(
    amrapFromHistory?.routines || {}
  ).find((routine) => normalizeName(routine?.name).includes("no equipment"));

  const travelNoEquipment = {
    name: "Travel - No Equipment",
    days: sortDaysNatural(
      noEquipFromHistory?.days?.length
        ? noEquipFromHistory.days
        : [
            {
              name: "Full Body A",
              exercises: [
                "BW Squat (Slow eccentric and hold)",
                "Push Ups",
                "Single Leg Glute Bridge",
                "Pike Pushup",
                "Reverse Lunges",
                "Prone Y-T-W raises",
                "Dead Bug",
              ].map((name) => bareExercise(name, "bodyweight")),
            },
          ]
    ),
  };

  const travelBand = {
    name: "Travel - Band",
    days: [
      {
        name: "Full Body Band A",
        exercises: [
          "Band Face Pull",
          "Straight Arm Band Pulldown",
          "Band Leg Extension",
          "Band Hamstring Curl",
          "Band Crunch",
          "Band Anti Rotation Hold",
          "Copenhagen Plank",
        ].map((name) => bareExercise(name, "band")),
      },
      {
        name: "Full Body Band B",
        exercises: [
          "Seated X3 Band Row",
          "Band Triceps Push Down",
          "X3 Band Squat",
          "Band Pull Aparts",
          "Lateral Raise + Face Pull",
          "Band Anti Rotation Hold",
        ].map((name) => bareExercise(name, "band")),
      },
    ],
  };

  return {
    amrap: {
      name: "AMRAP",
      days: sortDaysNatural([day1, day2, day3, day4]),
    },
    travelNoEquipment,
    travelBand,
  };
}

function getWeek7Routine() {
  const week = workoutData?.weeks?.["7"];
  if (!week) return null;
  return clone({
    name: "Gym + Band (Week 7)",
    days: week.days || [],
  });
}

function getMayBackupRoutine() {
  const routines = mayBackup?.workoutPlans?.routines;
  const list = Array.isArray(routines)
    ? routines
    : Object.values(routines || {});
  const first = list[0];
  if (!first?.days?.length) return null;
  return clone({
    name: first.name || "PPL 5 Day Split",
    days: first.days,
  });
}

/**
 * Best-effort reconstruction of the user's recent program library:
 * travel/AMRAP first, then complete gym backups, then other history.
 */
export function buildBestAvailableProgram(history = []) {
  const fromHistory = rebuildProgramFromHistory(history);
  const travel = buildTravelAndAmrapRoutines(history);
  const routines = {};
  let index = 0;

  const pushRoutine = (routine) => {
    if (!routine?.days?.length) return;
    routines[String(index++)] = {
      ...clone(routine),
      days: sortDaysNatural(routine.days || []),
    };
  };

  pushRoutine(travel.travelBand);
  pushRoutine(travel.travelNoEquipment);
  pushRoutine(travel.amrap);

  const week7 = getWeek7Routine();
  if (week7) pushRoutine(week7);

  const mayPpl = getMayBackupRoutine();
  if (mayPpl) pushRoutine(mayPpl);

  if (fromHistory?.routines) {
    for (const routine of Object.values(fromHistory.routines)) {
      const nameKey = normalizeName(routine?.name);
      if (
        nameKey === "amrap" ||
        nameKey.includes("no equipment") ||
        nameKey.includes("travel")
      ) {
        continue;
      }
      const already = Object.values(routines).some(
        (existing) => normalizeName(existing?.name) === nameKey
      );
      if (already && nameKey.includes("ppl 5 day split")) continue;
      pushRoutine(routine);
    }
  }

  if (!Object.keys(routines).length) return null;

  return overlayHistoryWeights({ routines }, history);
}
