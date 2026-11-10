export const LOGGING_MODES = [
  { id: "load", label: "Load", loadLabel: "Weight", valueLabel: "Reps", valueUnit: "reps", showLoad: true },
  { id: "bodyweight", label: "BW", loadLabel: "BW", valueLabel: "Reps", valueUnit: "reps", showLoad: false },
  { id: "band", label: "Band", loadLabel: "Band", valueLabel: "Reps", valueUnit: "reps", showLoad: true },
  {
    id: "time",
    label: "Time",
    loadLabel: "Load",
    valueLabel: "Secs",
    valueUnit: "secs",
    showLoad: true,
    loadOptional: true,
  },
];

export const BAND_OPTIONS = [
  "White",
  "Grey",
  "Black",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Purple",
  "Pink",
  "Light",
  "Medium",
  "Heavy",
];

export const BAND_WEIGHT_RE =
  /^(white|grey|gray|black|red|blue|green|yellow|orange|purple|pink|light|heavy|med(ium)?)$/i;
export const BW_WEIGHT_RE = /^(bw|body\s*weight|bodyweight)$/i;

export function getLoggingModeMeta(mode) {
  return LOGGING_MODES.find((item) => item.id === mode) || LOGGING_MODES[0];
}

export function inferLoggingMode(exercise) {
  if (exercise?.loggingMode && getLoggingModeMeta(exercise.loggingMode)) {
    return exercise.loggingMode;
  }

  const name = String(exercise?.name || "").toLowerCase();
  if (/(plank|hold|dead hang|hang|wall sit|isometric)/i.test(name)) {
    return "time";
  }

  const weights = (exercise?.sets || [])
    .map((set) => String(set?.weight ?? set?.plannedWeight ?? "").trim())
    .filter(Boolean);

  if (weights.length && weights.every((weight) => BW_WEIGHT_RE.test(weight))) {
    return "bodyweight";
  }

  if (weights.length && weights.every((weight) => BAND_WEIGHT_RE.test(weight))) {
    return "band";
  }

  return "load";
}

export function getPlannedLoad(set) {
  return set?.plannedWeight ?? set?.weight ?? "";
}

export function getPlannedValue(set) {
  return set?.targetReps ?? set?.reps ?? "";
}

export function normalizeBandLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^med(ium)?$/i.test(raw)) return "Medium";
  if (/^gray$/i.test(raw)) return "Grey";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export function buildBandDialValues(include = []) {
  const values = [...BAND_OPTIONS];
  for (const extra of include) {
    const label = normalizeBandLabel(extra);
    if (!label) continue;
    if (!values.some((v) => v.toLowerCase() === label.toLowerCase())) {
      values.push(label);
    }
  }
  return values;
}

export function formatTargetLine(exercise, set) {
  const mode = inferLoggingMode(exercise);
  const meta = getLoggingModeMeta(mode);
  const load = String(getPlannedLoad(set) || "").trim();
  const value = String(getPlannedValue(set) || "").trim();
  const valueNum = Number(value);
  const valueWord =
    mode === "time"
      ? Number.isFinite(valueNum) && valueNum === 1
        ? "sec"
        : "secs"
      : Number.isFinite(valueNum) && valueNum === 1
        ? "rep"
        : "reps";

  if (mode === "bodyweight") {
    return value ? `Target · BW × ${value} ${valueWord}` : "Target · BW";
  }

  if (mode === "band") {
    const band = normalizeBandLabel(load) || "Band";
    return value
      ? `Target · ${band} × ${value} ${valueWord}`
      : `Target · ${band}`;
  }

  if (mode === "time") {
    if (load && BW_WEIGHT_RE.test(load)) {
      return value ? `Target · BW × ${value} ${valueWord}` : "Target · BW";
    }
    if (load && value) return `Target · ${load} × ${value} ${valueWord}`;
    if (value) return `Target · ${value} ${valueWord}`;
    return "Target · Time";
  }

  // load
  if (load && value) return `Target · ${load} kg × ${value} ${valueWord}`;
  if (load) return `Target · ${load} kg`;
  if (value) return `Target · ${value} ${valueWord}`;
  return `Target · -`;
}

export function getValueUnitLabel(mode) {
  return getLoggingModeMeta(mode).valueUnit === "secs" ? "secs" : "reps";
}

/** Short prescription line for AMRAP circuit cards (no "Target ·" prefix). */
export function formatCircuitPrescription(exercise) {
  const set = exercise?.sets?.[0];
  if (!set) return "No prescription";
  return formatTargetLine(exercise, set).replace(/^Target ·\s*/, "");
}
