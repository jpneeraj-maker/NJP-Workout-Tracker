import { getAmrapDurationMinutes, isAmrapDay } from "./schema";

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function formatExportDate() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getSetLoad(set) {
  const v = set?.weight ?? set?.plannedWeight ?? "";
  return String(v ?? "").trim();
}

function getSetReps(set) {
  const v = set?.reps ?? set?.targetReps ?? "";
  return String(v ?? "").trim();
}

function formatSetLine(set, index) {
  const type = String(set?.type || `Set ${index + 1}`).trim();
  const load = getSetLoad(set) || "-";
  const reps = getSetReps(set) || "-";
  return `     ${type.padEnd(14)} ${load} × ${reps}`;
}

function formatExerciseBlock(exercise, index) {
  const name = String(exercise?.name || `Exercise ${index + 1}`).trim();
  const lines = [`  ${index + 1}. ${name}`];
  const mode = String(exercise?.loggingMode || "").trim();
  if (mode && mode !== "load") {
    lines.push(`     Mode: ${mode}`);
  }

  const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];
  if (sets.length === 0) {
    lines.push("     (no sets)");
  } else {
    sets.forEach((set, i) => lines.push(formatSetLine(set, i)));
  }

  const remarks = String(exercise?.remarks || "").trim();
  if (remarks) {
    lines.push(`     Notes: ${remarks}`);
  }

  return lines.join("\n");
}

function formatDayBlock(day, dayIndex) {
  const name = String(day?.name || `Day ${dayIndex + 1}`).trim();
  const lines = [`DAY ${dayIndex + 1} — ${name}`];

  if (isAmrapDay(day)) {
    lines.push(
      `  Mode: AMRAP · ${getAmrapDurationMinutes(day)} min`
    );
  }

  const exercises = Array.isArray(day?.exercises) ? day.exercises : [];
  if (exercises.length === 0) {
    lines.push("  (no exercises)");
  } else if (isAmrapDay(day)) {
    lines.push("  Circuit:");
    exercises.forEach((exercise, i) => {
      lines.push(formatExerciseBlock(exercise, i));
    });
  } else {
    exercises.forEach((exercise, i) => {
      lines.push(formatExerciseBlock(exercise, i));
    });
  }

  return lines.join("\n");
}

function formatRoutineBlock(routine, routineIndex, dayIndexes = null) {
  const name = String(routine?.name || `Routine ${routineIndex + 1}`).trim();
  const days = Array.isArray(routine?.days) ? routine.days : [];
  const indexes =
    dayIndexes == null
      ? days.map((_, i) => i)
      : dayIndexes.filter((i) => i >= 0 && i < days.length);

  const lines = [
    "════════════════════════════════",
    `ROUTINE: ${name}`,
    "────────────────────────────────",
  ];

  if (indexes.length === 0) {
    lines.push("(no days selected)");
  } else {
    indexes.forEach((dayIndex, n) => {
      if (n > 0) lines.push("");
      lines.push(formatDayBlock(days[dayIndex], dayIndex));
    });
  }

  return lines.join("\n");
}

function normalizeExerciseKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeExerciseInDay(exercise) {
  const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];
  const loads = sets.map(getSetLoad).filter(Boolean);
  const top = loads.length ? loads[loads.length - 1] : "-";
  return `${sets.length} set${sets.length === 1 ? "" : "s"} · top ${top}`;
}

/**
 * Build a deduped exercise catalog across the given routines.
 * @param {Array} routines
 * @param {number[]|null} routineIndexes - null = all
 */
export function buildExerciseCatalog(routines = [], routineIndexes = null) {
  const list = Array.isArray(routines) ? routines : [];
  const indexes =
    routineIndexes == null
      ? list.map((_, i) => i)
      : routineIndexes.filter((i) => i >= 0 && i < list.length);

  const map = new Map();

  indexes.forEach((rIndex) => {
    const routine = list[rIndex];
    const routineName = String(routine?.name || `Routine ${rIndex + 1}`).trim();
    const days = Array.isArray(routine?.days) ? routine.days : [];

    days.forEach((day, dIndex) => {
      const dayName = String(day?.name || `Day ${dIndex + 1}`).trim();
      (day?.exercises || []).forEach((exercise) => {
        const name = String(exercise?.name || "").trim() || "Unnamed exercise";
        const key = normalizeExerciseKey(name);
        if (!map.has(key)) {
          map.set(key, { name, appearances: [] });
        }
        map.get(key).appearances.push({
          routineName,
          dayName,
          summary: summarizeExerciseInDay(exercise),
        });
      });
    });
  });

  return [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

export function formatExerciseCatalogText(catalog, title = "EXERCISE CATALOG") {
  const lines = [
    `NJP Workout Tracker — ${title}`,
    `Exported: ${formatExportDate()}`,
    "",
    `${catalog.length} unique exercise${catalog.length === 1 ? "" : "s"}`,
    "",
  ];

  if (catalog.length === 0) {
    lines.push("(no exercises)");
    return lines.join("\n");
  }

  catalog.forEach((item) => {
    lines.push(`• ${item.name}`);
    item.appearances.forEach((a) => {
      lines.push(`  - ${a.routineName} / ${a.dayName} · ${a.summary}`);
    });
    lines.push("");
  });

  return lines.join("\n").trimEnd() + "\n";
}

/**
 * Format routines as readable text.
 * @param {Array} routines
 * @param {{ routineIndexes?: number[]|null, dayIndexesByRoutine?: Record<number, number[]|null> }} options
 */
export function formatProgramAsText(routines = [], options = {}) {
  const list = Array.isArray(routines) ? routines : [];
  const {
    routineIndexes = null,
    dayIndexesByRoutine = {},
    title = "Program",
  } = options;

  const indexes =
    routineIndexes == null
      ? list.map((_, i) => i)
      : routineIndexes.filter((i) => i >= 0 && i < list.length);

  const lines = [
    `NJP Workout Tracker — ${title}`,
    `Exported: ${formatExportDate()}`,
    "",
  ];

  if (indexes.length === 0) {
    lines.push("(no routines selected)");
    return lines.join("\n");
  }

  indexes.forEach((rIndex, n) => {
    if (n > 0) lines.push("", "");
    const dayIndexes = dayIndexesByRoutine[rIndex];
    lines.push(
      formatRoutineBlock(
        list[rIndex],
        rIndex,
        dayIndexes === undefined ? null : dayIndexes
      )
    );
  });

  lines.push("");
  return lines.join("\n");
}

export function buildExportFilename(scopeLabel) {
  const safe = String(scopeLabel || "program")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `njp-${safe || "program"}-${todayStamp()}.txt`;
}

export function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}
