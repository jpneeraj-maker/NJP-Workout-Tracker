import { useState, useEffect, useRef } from "react";
import {
  Trash2,
  ImagePlus,
  ArrowLeft,
  ChevronDown,
  Undo2,
  Download,
  Copy,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { getExerciseImage } from "../exerciseImages";
import {
  uploadExerciseImage,
  deleteExerciseImageByUrl,
} from "../exerciseImageUpload";
import WheelDial, {
  buildRepValues,
  buildWeightValues,
} from "../components/WheelDial";
import {
  buildBandDialValues,
  normalizeBandLabel,
} from "../loggingModes";
import {
  buildExerciseCatalog,
  buildExportFilename,
  copyTextToClipboard,
  downloadTextFile,
  formatExerciseCatalogText,
  formatProgramAsText,
} from "../programTextExport";
import { useFittingInputFont } from "../components/FittingText";

const LOGGING_MODES = [
  { id: "load", label: "Load", loadLabel: "Weight", valueLabel: "Reps", showLoad: true },
  { id: "bodyweight", label: "BW", loadLabel: "BW", valueLabel: "Reps", showLoad: false },
  { id: "band", label: "Band", loadLabel: "Band", valueLabel: "Reps", showLoad: true },
  { id: "time", label: "Time", loadLabel: "Load", valueLabel: "Secs", showLoad: true, loadOptional: true },
];

const BAND_WEIGHT_RE =
  /^(white|grey|gray|black|red|blue|green|yellow|orange|purple|pink|light|heavy|med(ium)?)$/i;
const BW_WEIGHT_RE = /^(bw|body\s*weight|bodyweight)$/i;

function getLoggingModeMeta(mode) {
  return LOGGING_MODES.find((item) => item.id === mode) || LOGGING_MODES[0];
}

function inferLoggingMode(exercise) {
  if (exercise?.loggingMode && getLoggingModeMeta(exercise.loggingMode)) {
    return exercise.loggingMode;
  }

  const name = String(exercise?.name || "").toLowerCase();
  if (/(plank|hold|dead hang|hang|wall sit|isometric)/i.test(name)) {
    return "time";
  }

  const weights = (exercise?.sets || [])
    .map((set) => String(set?.weight ?? "").trim())
    .filter(Boolean);

  if (weights.length && weights.every((weight) => BW_WEIGHT_RE.test(weight))) {
    return "bodyweight";
  }

  if (weights.length && weights.every((weight) => BAND_WEIGHT_RE.test(weight))) {
    return "band";
  }

  return "load";
}

function createEmptySet(mode = "load", fromSet = null) {
  if (fromSet) {
    return {
      weight: fromSet.weight ?? "",
      reps: fromSet.reps ?? "",
    };
  }

  return {
    weight: mode === "bodyweight" ? "BW" : "",
    reps: "",
  };
}

function applyLoggingModeToSets(sets, mode) {
  return (sets || []).map((set) => {
    const next = { ...set, weight: set.weight ?? "", reps: set.reps ?? "" };
    if (mode === "bodyweight") {
      next.weight = "BW";
    } else if (mode === "load" && BW_WEIGHT_RE.test(String(next.weight || "").trim())) {
      next.weight = "";
    }
    return next;
  });
}

function normalizeExerciseName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getPlannedLoad(set) {
  return set?.weight ?? set?.plannedWeight ?? set?.actualWeight ?? "";
}

function getPlannedReps(set) {
  return set?.reps ?? set?.targetReps ?? set?.actualReps ?? "";
}

function isBlankPrescription(exercise) {
  const sets = exercise?.sets || [];
  if (!sets.length) return true;

  return sets.every((set) => {
    const weight = String(getPlannedLoad(set) || "").trim();
    const reps = String(getPlannedReps(set) ?? "").trim();
    const weightIsPlaceholder = !weight || BW_WEIGHT_RE.test(weight);
    return weightIsPlaceholder && !reps;
  });
}

function summarizeExerciseSets(exercise) {
  const sets = exercise?.sets || [];
  const count = sets.length;
  if (!count) return "No sets yet";

  const mode = inferLoggingMode(exercise);
  const loads = sets
    .map((set) => String(getPlannedLoad(set) || "").trim())
    .filter(Boolean);
  const repsList = sets
    .map((set) => String(getPlannedReps(set) ?? "").trim())
    .filter(Boolean);

  const uniqueLoads = [...new Set(loads)];
  const uniqueReps = [...new Set(repsList)];

  const loadPart =
    uniqueLoads.length === 0
      ? null
      : uniqueLoads.length === 1
        ? uniqueLoads[0]
        : uniqueLoads.length <= 3
          ? uniqueLoads.join("/")
          : `${uniqueLoads[0]}…`;

  let repsPart = null;
  if (uniqueReps.length === 1) {
    repsPart = uniqueReps[0];
  } else if (uniqueReps.length > 1) {
    const nums = uniqueReps.map(Number).filter((n) => Number.isFinite(n));
    repsPart =
      nums.length === uniqueReps.length
        ? `${Math.min(...nums)}–${Math.max(...nums)}`
        : uniqueReps.join("/");
  }

  const setLabel = `${count} ${count === 1 ? "set" : "sets"}`;

  if (mode === "bodyweight") {
    return repsPart ? `${setLabel} · BW × ${repsPart}` : `${setLabel} · BW`;
  }

  if (mode === "time") {
    if (loadPart && repsPart) return `${setLabel} · ${loadPart} × ${repsPart}s`;
    if (repsPart) return `${setLabel} · ${repsPart}s`;
    return setLabel;
  }

  if (mode === "band") {
    if (loadPart && repsPart) return `${setLabel} · ${loadPart} × ${repsPart}`;
    if (loadPart) return `${setLabel} · ${loadPart}`;
    return setLabel;
  }

  if (loadPart && repsPart) return `${setLabel} · ${loadPart} × ${repsPart}`;
  if (loadPart) return `${setLabel} · ${loadPart}`;
  if (repsPart) return `${setLabel} · ${repsPart} reps`;
  return setLabel;
}

function findLatestHistoryExercise(history, exerciseName) {
  const key = normalizeExerciseName(exerciseName);
  if (!key) return null;

  for (const workout of history || []) {
    const match = (workout.exercises || []).find(
      (ex) => normalizeExerciseName(ex.name) === key
    );
    if (match?.sets?.length) return { workout, exercise: match };
  }

  return null;
}

function setsFromHistoryExercise(historyExercise) {
  return (historyExercise?.sets || []).map((set) => ({
    weight: String(
      set.actualWeight || set.plannedWeight || set.weight || ""
    ).trim(),
    reps: String(set.actualReps || set.targetReps || set.reps || "").trim(),
  }));
}

function formatHistoryDate(workout) {
  if (!workout?.date) return "last session";
  try {
    return new Date(workout.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "last session";
  }
}

function buildSettingsWeightDialValues(loggingMode, sets = []) {
  const include = sets.map((set) => set?.weight);

  if (loggingMode === "band") {
    return buildBandDialValues(include);
  }

  if (loggingMode === "time") {
    const numeric = buildWeightValues({ include });
    return ["", "BW", ...numeric.filter((v) => v !== "0")];
  }

  return buildWeightValues({ include });
}

function buildSettingsRepDialValues(loggingMode, sets = []) {
  return buildRepValues({
    min: 0,
    max: loggingMode === "time" ? 300 : 50,
    include: sets.map((set) => set?.reps),
  });
}

function EditorSection({ title, summary, open, onToggle, children }) {
  return (
    <div
      className={`rounded-xl border bg-black/35 overflow-hidden transition-colors ${
        open
          ? "border-stone-400/50 shadow-[0_0_0_1px_rgba(168,162,158,0.12)]"
          : "border-white/25"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left active:scale-[0.99] transition"
      >
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-300/80">
            {title}
          </div>
          {!open && summary ? (
            <div className="mt-0.5 text-xs text-white/65 break-words">
              {summary}
            </div>
          ) : null}
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-stone-400/80 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="border-t border-stone-400/25 px-3 py-3">{children}</div>
      ) : null}
    </div>
  );
}

export default function SettingsPage(props) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [uploadingImageKey, setUploadingImageKey] = useState(null);
  const [routineMenuOpen, setRoutineMenuOpen] = useState(false);
  const [showProgramExport, setShowProgramExport] = useState(false);
  const [exportScope, setExportScope] = useState("all-routines");
  const [exportRoutineIndexes, setExportRoutineIndexes] = useState([]);
  const [exportDayRoutineIndex, setExportDayRoutineIndex] = useState(0);
  const [exportDayIndexes, setExportDayIndexes] = useState([]);
  const [exportCatalogRoutineIndex, setExportCatalogRoutineIndex] = useState(0);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const imageInputRef = useRef(null);
  const pendingImageTargetRef = useRef(null);
  const routineMenuRef = useRef(null);
  const {
    data,
    setData, 
    workoutHistory,
    selectedRoutine,
    selectedDay
  } = props;

 const [draftProgram, setDraftProgramRaw] = useState({
  routines: [
    {
      name: "Routine 1",
      days: [
        {
          name: "Day 1",
          exercises: []
        }
      ]
    }
  ]
});
const undoStackRef = useRef([]);
const coalesceGateRef = useRef(0);
const exerciseUndoStacksRef = useRef({});
const exerciseCoalesceGateRef = useRef({});
const [canUndo, setCanUndo] = useState(false);
const [exerciseUndoTick, setExerciseUndoTick] = useState(0);

function exerciseUndoKey(routineIndex, dayIndex, exIndex) {
  return `${routineIndex}:${dayIndex}:${exIndex}`;
}

function bumpExerciseUndoUi() {
  Promise.resolve().then(() => {
    setExerciseUndoTick((tick) => tick + 1);
  });
}

function clearExerciseUndoStacks(prefix = null) {
  if (!prefix) {
    exerciseUndoStacksRef.current = {};
    exerciseCoalesceGateRef.current = {};
    bumpExerciseUndoUi();
    return;
  }

  for (const key of Object.keys(exerciseUndoStacksRef.current)) {
    if (key.startsWith(prefix)) delete exerciseUndoStacksRef.current[key];
  }
  for (const key of Object.keys(exerciseCoalesceGateRef.current)) {
    if (key.startsWith(prefix)) delete exerciseCoalesceGateRef.current[key];
  }
  bumpExerciseUndoUi();
}

function recordExerciseUndoSnapshot(key, exercise, coalesce = false) {
  if (!key || !exercise) return;

  const now = Date.now();
  const gate = exerciseCoalesceGateRef.current[key] || 0;
  const shouldRecord = !coalesce || now >= gate;

  if (shouldRecord) {
    try {
      const snapshot = JSON.stringify(exercise);
      const stack = exerciseUndoStacksRef.current[key] || [];
      if (stack[stack.length - 1] !== snapshot) {
        stack.push(snapshot);
        if (stack.length > 20) stack.shift();
        exerciseUndoStacksRef.current[key] = stack;
      }
      bumpExerciseUndoUi();
    } catch {
      // ignore snapshot failures
    }
  }

  exerciseCoalesceGateRef.current[key] = coalesce ? now + 800 : 0;
}

function canUndoExercise(dayIndex, exIndex) {
  void exerciseUndoTick;
  const key = exerciseUndoKey(activeRoutineIndex, dayIndex, exIndex);
  return (exerciseUndoStacksRef.current[key] || []).length > 0;
}

function setDraftProgram(updater, options = {}) {
  const coalesce = options.coalesce === true;

  setDraftProgramRaw((prev) => {
    const now = Date.now();
    const shouldRecord = !coalesce || now >= coalesceGateRef.current;

    if (shouldRecord) {
      try {
        const snapshot = JSON.stringify(prev);
        const stack = undoStackRef.current;
        if (stack[stack.length - 1] !== snapshot) {
          stack.push(snapshot);
          if (stack.length > 40) stack.shift();
        }
      } catch {
        // ignore snapshot failures
      }
      Promise.resolve().then(() => {
        setCanUndo(undoStackRef.current.length > 0);
      });
    }

    coalesceGateRef.current = coalesce ? now + 800 : 0;

    return typeof updater === "function" ? updater(prev) : updater;
  });
}

function undoLastChange() {
  const stack = undoStackRef.current;
  if (!stack.length) return;

  const confirmed = confirm(
    "Undo the last change across the whole program?\n\nThis can affect other exercises, days, and routines — not just the one you were editing."
  );
  if (!confirmed) return;

  try {
    const previous = JSON.parse(stack.pop());
    setCanUndo(stack.length > 0);
    coalesceGateRef.current = 0;
    // Global restore may not match per-exercise stacks; clear them.
    clearExerciseUndoStacks();
    setDraftProgramRaw(previous);
  } catch {
    setCanUndo(stack.length > 0);
  }
}

function undoExerciseAt(dayIndex, exIndex) {
  const key = exerciseUndoKey(activeRoutineIndex, dayIndex, exIndex);
  const stack = exerciseUndoStacksRef.current[key] || [];
  if (!stack.length) return;

  try {
    const previousExercise = JSON.parse(stack.pop());
    bumpExerciseUndoUi();

    setDraftProgram((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const exercises =
        updated.routines?.[activeRoutineIndex]?.days?.[dayIndex]?.exercises;
      if (!exercises?.[exIndex]) return prev;
      exercises[exIndex] = previousExercise;
      return updated;
    });
  } catch {
    bumpExerciseUndoUi();
  }
}

useEffect(() => {
  if (!data || isInitialized) return;

  const cloned = JSON.parse(JSON.stringify(data));
  const routinesArray = Array.isArray(cloned.routines)
  ? cloned.routines
  : Object.values(cloned.routines || {});

routinesArray.forEach(r => {
    r.days = r.days || [];
    r.days.forEach(d => {
      d.exercises = d.exercises || [];
      d.exercises.forEach(ex => {
        ex.sets = ex.sets || [];
      });
    });
  });
  
  cloned.routines = routinesArray;

  undoStackRef.current = [];
  setCanUndo(false);
  coalesceGateRef.current = 0;
  clearExerciseUndoStacks();
  setDraftProgramRaw(cloned);
  setIsInitialized(true); // ✅ runs ONLY once
}, [data, isInitialized]);

useEffect(() => {
  if (!isInitialized) return;

  if (!draftProgram || !draftProgram.routines) return;

  // prevent empty overwrite
  if (draftProgram.routines.length === 0) return;

  // 🔴 ONLY update if different
  if (JSON.stringify(draftProgram) !== JSON.stringify(data)) {
    setData(draftProgram);
  }
}, [draftProgram]);

const [saveStatus, setSaveStatus] = useState("");
useEffect(() => {
  if (!draftProgram) return;

  setSaveStatus("saving");

  const timeout = setTimeout(() => {
    localStorage.setItem(
      "workout-app-data",
      JSON.stringify(draftProgram)
    );

    setSaveStatus("Saved");

    setTimeout(() => {
      setSaveStatus("");
    }, 1500);
  }, 400); // debounce

  return () => clearTimeout(timeout);
}, [draftProgram]);

useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (saveStatus === "saving") {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [saveStatus]);

const [activeRoutineIndex, setActiveRoutineIndex] = useState(0);
useEffect(() => {
  if (selectedRoutine !== undefined) {
    setActiveRoutineIndex(selectedRoutine);
  }
}, [selectedRoutine]);

useEffect(() => {
  if (!routineMenuOpen) return;

  function handlePointerDown(event) {
    if (!routineMenuRef.current?.contains(event.target)) {
      setRoutineMenuOpen(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") setRoutineMenuOpen(false);
  }

  document.addEventListener("mousedown", handlePointerDown);
  document.addEventListener("keydown", handleKeyDown);
  return () => {
    document.removeEventListener("mousedown", handlePointerDown);
    document.removeEventListener("keydown", handleKeyDown);
  };
}, [routineMenuOpen]);

const routinesArray = draftProgram?.routines || [];
const selectedRoutineData =
  routinesArray[activeRoutineIndex] || null;
const selectedRoutineName =
  selectedRoutineData?.name || `Routine ${activeRoutineIndex + 1}`;
const routineNameInputRef = useFittingInputFont(
  selectedRoutineData?.name ?? "",
  { maxSize: 14, minSize: 11 }
);

function openProgramExport() {
  const allIndexes = routinesArray.map((_, i) => i);
  setExportScope("all-routines");
  setExportRoutineIndexes(allIndexes);
  setExportDayRoutineIndex(activeRoutineIndex);
  setExportDayIndexes(
    (routinesArray[activeRoutineIndex]?.days || []).map((_, i) => i)
  );
  setExportCatalogRoutineIndex(activeRoutineIndex);
  setExportNotice("");
  setShowProgramExport(true);
}

function toggleExportRoutine(index) {
  setExportRoutineIndexes((prev) =>
    prev.includes(index)
      ? prev.filter((i) => i !== index)
      : [...prev, index].sort((a, b) => a - b)
  );
}

function toggleExportDay(index) {
  setExportDayIndexes((prev) =>
    prev.includes(index)
      ? prev.filter((i) => i !== index)
      : [...prev, index].sort((a, b) => a - b)
  );
}

const exportDayRoutine = routinesArray[exportDayRoutineIndex] || null;

function buildProgramExportPayload() {
  const routines = routinesArray;

  if (exportScope === "all-routines") {
    return {
      text: formatProgramAsText(routines, {
        title: "All routines",
      }),
      filename: buildExportFilename("all-routines"),
    };
  }

  if (exportScope === "selected-routines") {
    const indexes = exportRoutineIndexes.filter(
      (i) => i >= 0 && i < routines.length
    );
    if (!indexes.length) {
      throw new Error("Select at least one routine.");
    }
    const label =
      indexes.length === 1
        ? routines[indexes[0]]?.name || "routine"
        : `${indexes.length}-routines`;
    return {
      text: formatProgramAsText(routines, {
        routineIndexes: indexes,
        title: "Selected routines",
      }),
      filename: buildExportFilename(label),
    };
  }

  if (exportScope === "routine-days") {
    const rIndex = exportDayRoutineIndex;
    if (!routines[rIndex]) {
      throw new Error("Pick a routine.");
    }
    const days = exportDayIndexes.filter(
      (i) => i >= 0 && i < (routines[rIndex].days || []).length
    );
    if (!days.length) {
      throw new Error("Select at least one day.");
    }
    const routineName = routines[rIndex]?.name || `routine-${rIndex + 1}`;
    const dayLabel =
      days.length === (routines[rIndex].days || []).length
        ? "all-days"
        : days
            .map((i) => routines[rIndex].days[i]?.name || `day-${i + 1}`)
            .join("-");
    return {
      text: formatProgramAsText(routines, {
        routineIndexes: [rIndex],
        dayIndexesByRoutine: { [rIndex]: days },
        title: `${routineName} — selected days`,
      }),
      filename: buildExportFilename(`${routineName}-${dayLabel}`),
    };
  }

  if (exportScope === "catalog-all") {
    const catalog = buildExerciseCatalog(routines);
    return {
      text: formatExerciseCatalogText(catalog, "Exercise catalog (all)"),
      filename: buildExportFilename("exercise-catalog"),
    };
  }

  if (exportScope === "catalog-routine") {
    const rIndex = exportCatalogRoutineIndex;
    if (!routines[rIndex]) {
      throw new Error("Pick a routine.");
    }
    const routineName = routines[rIndex]?.name || `routine-${rIndex + 1}`;
    const catalog = buildExerciseCatalog(routines, [rIndex]);
    return {
      text: formatExerciseCatalogText(
        catalog,
        `Exercise catalog — ${routineName}`
      ),
      filename: buildExportFilename(`${routineName}-exercises`),
    };
  }

  throw new Error("Unknown export scope.");
}

async function handleProgramDownload() {
  setExportBusy(true);
  setExportNotice("");
  try {
    const { text, filename } = buildProgramExportPayload();
    downloadTextFile(text, filename);
    setExportNotice("Downloaded.");
  } catch (err) {
    setExportNotice(err?.message || "Download failed.");
  } finally {
    setExportBusy(false);
  }
}

async function handleProgramCopy() {
  setExportBusy(true);
  setExportNotice("");
  try {
    const { text } = buildProgramExportPayload();
    await copyTextToClipboard(text);
    setExportNotice("Copied to clipboard.");
  } catch (err) {
    setExportNotice(err?.message || "Copy failed.");
  } finally {
    setExportBusy(false);
  }
}

function addRoutine() {
  const copy = confirm("Copy last routine?");

  setDraftProgram((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));
    const list = updated.routines;
    let newRoutine;

    if (copy && list.length > 0) {
      newRoutine = JSON.parse(JSON.stringify(list[list.length - 1]));
      newRoutine.name = `${newRoutine.name || "Routine"} (copy)`;
    } else {
      newRoutine = {
        name: `Routine ${list.length + 1}`,
        days: [{ name: "New Day", exercises: [] }],
      };
    }

    list.push(newRoutine);
    return updated;
  });

  setActiveRoutineIndex(routinesArray.length);
  setRoutineMenuOpen(false);
}

function deleteActiveRoutine() {
  const list = draftProgram.routines;

  if (list.length === 1) {
    alert("At least one routine is required.");
    return;
  }

  if (!confirm(`Delete ${selectedRoutineName}?`)) return;

  const updated = { ...draftProgram };
  const updatedRoutinesArray = [...updated.routines];
  updatedRoutinesArray.splice(activeRoutineIndex, 1);
  updated.routines = updatedRoutinesArray;
  setDraftProgram(updated);
  setActiveRoutineIndex((prev) => Math.max(0, prev - 1));
  setRoutineMenuOpen(false);
}

function updateExerciseAt(dayIndex, exIndex, updater, options = {}) {
  const coalesce = options.coalesce === true;
  const key = exerciseUndoKey(activeRoutineIndex, dayIndex, exIndex);

  setDraftProgram((prev) => {
    const current =
      prev?.routines?.[activeRoutineIndex]?.days?.[dayIndex]?.exercises?.[
        exIndex
      ];
    if (!current) return prev;

    recordExerciseUndoSnapshot(key, current, coalesce);

    const updated = JSON.parse(JSON.stringify(prev));
    const exercise =
      updated.routines[activeRoutineIndex].days[dayIndex].exercises[exIndex];
    updater(exercise);
    return updated;
  }, options);
}

const [expandedDayIndex, setExpandedDayIndex] = useState(null);
const [expandedExercises, setExpandedExercises] = useState({});
const [editorSections, setEditorSections] = useState({});

const EDITOR_SECTION_DEFAULTS = {
  lastSession: false,
  mode: false,
};

function isEditorSectionOpen(exerciseKey, section) {
  const current = editorSections[exerciseKey]?.[section];
  if (current === undefined) return EDITOR_SECTION_DEFAULTS[section] ?? false;
  return current;
}

function toggleEditorSection(exerciseKey, section) {
  setEditorSections((prev) => {
    const current = prev[exerciseKey] || {};
    const open = current[section] ?? EDITOR_SECTION_DEFAULTS[section] ?? false;
    return {
      ...prev,
      [exerciseKey]: {
        ...current,
        [section]: !open,
      },
    };
  });
}

useEffect(() => {
  function handleKeyDown(event) {
    const key = String(event.key || "").toLowerCase();
    const wantsUndo =
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      key === "z";
    if (!wantsUndo) return;

    const tag = event.target?.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      event.target?.isContentEditable
    ) {
      return;
    }

    const openKeys = Object.keys(expandedExercises || {}).filter(
      (k) => expandedExercises[k]
    );
    if (openKeys.length === 1) {
      const [dayIndex, exIndex] = openKeys[0].split("-").map(Number);
      if (
        Number.isFinite(dayIndex) &&
        Number.isFinite(exIndex) &&
        canUndoExercise(dayIndex, exIndex)
      ) {
        event.preventDefault();
        undoExerciseAt(dayIndex, exIndex);
        return;
      }
    }

    if (!canUndo) return;
    event.preventDefault();
    undoLastChange();
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [canUndo, exerciseUndoTick, expandedExercises, activeRoutineIndex]);

function openExerciseImagePicker(dayIndex, exIndex) {
  pendingImageTargetRef.current = { dayIndex, exIndex };
  imageInputRef.current?.click();
}

async function handleExerciseImageSelected(event) {
  const file = event.target.files?.[0];
  const target = pendingImageTargetRef.current;
  event.target.value = "";
  pendingImageTargetRef.current = null;

  if (!file || !target) return;

  const { dayIndex, exIndex } = target;
  const key = `${dayIndex}-${exIndex}`;
  const exercise =
    draftProgram?.routines?.[activeRoutineIndex]?.days?.[dayIndex]
      ?.exercises?.[exIndex];

  if (!exercise) return;

  setUploadingImageKey(key);

  try {
    const previousUrl = exercise.image;
    const { url } = await uploadExerciseImage(file, {
      name: exercise.name || "exercise",
    });

    updateExerciseAt(dayIndex, exIndex, (ex) => {
      ex.image = url;
    });

    if (previousUrl && previousUrl !== url) {
      await deleteExerciseImageByUrl(previousUrl);
    }
  } catch (err) {
    console.error("Exercise image upload failed", err);
    alert(err?.message || "Image upload failed");
  } finally {
    setUploadingImageKey(null);
  }
}

async function removeExerciseImage(dayIndex, exIndex) {
  const exercise =
    draftProgram?.routines?.[activeRoutineIndex]?.days?.[dayIndex]
      ?.exercises?.[exIndex];
  if (!exercise?.image) return;

  if (!confirm("Remove this custom exercise image?")) return;

  const previousUrl = exercise.image;

  updateExerciseAt(dayIndex, exIndex, (ex) => {
    delete ex.image;
  });

  await deleteExerciseImageByUrl(previousUrl);
}

const exerciseLibrary = [
  ...new Set(
    draftProgram?.routines || []
      .flatMap((routine) => routine.days || [])
      .flatMap((day) => day.exercises || [])
      .map((ex) => ex.name)
      .filter(Boolean)
  )
];
const [searchTerm, setSearchTerm] = useState("");

async function handleUploadToCloud() {
  try {
    console.log("MANUAL UPLOAD START");

    const backupData = {
      workoutPlans: data,
      workoutHistory,
      activeWorkoutState: JSON.parse(
        localStorage.getItem("active-workout-state") || "{}"
      ),
      selectedRoutine,
      selectedDay,
      exportDate: new Date().toISOString(),
      version: 1,
    };

    const { error } = await supabase
      .from("workout_data")
      .update({
        data: backupData,
      })
      .eq("user_id", "default-user");

    if (error) throw error;

    console.log("MANUAL UPLOAD SUCCESS");
    alert("Uploaded to cloud successfully");
  } catch (err) {
    console.error("Manual upload failed", err);
    alert("Upload failed");
  }
}

return (    
    <>
  <input
    ref={imageInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleExerciseImageSelected}
  />
<div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1.5 pt-3 sm:gap-2">
  {/* LEFT — Back */}
  <button
    onClick={() => {
      if (props.settingsSource === "preview") {
        props.setActiveTab("workout");
      } else {
        props.setActiveScreen("landing");
      }
    }}
    className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-md text-stone-200 text-base border border-stone-400/40 hover:bg-black/70 active:scale-[0.97] transition"
  >
    <ArrowLeft size={10} />
  </button>

  {/* CENTER — Selected routine dropdown */}
  <div className="relative min-w-0" ref={routineMenuRef}>
    <div className="inline-flex w-full min-w-0 items-center gap-2 rounded-xl border border-stone-400/30 bg-black/30 py-1.5 pl-2.5 pr-2 text-sm text-white/90">
      <span className="h-7 w-[3px] shrink-0 rounded-full bg-stone-400/80" />
      <span className="min-w-0 flex-1">
        <span className="mb-0.5 block text-[10px] uppercase leading-none tracking-[0.14em] text-stone-400/80">
          Routine
        </span>
        <input
          ref={routineNameInputRef}
          value={selectedRoutineData?.name ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            setDraftProgram((prev) => {
              const updated = JSON.parse(JSON.stringify(prev));
              if (!updated.routines[activeRoutineIndex]) return prev;
              updated.routines[activeRoutineIndex].name = value;
              return updated;
            }, { coalesce: true });
          }}
          onBlur={(e) => {
            if (!e.target.value.trim()) {
              setDraftProgram((prev) => {
                const updated = JSON.parse(JSON.stringify(prev));
                if (!updated.routines[activeRoutineIndex]) return prev;
                updated.routines[activeRoutineIndex].name = `Routine ${
                  activeRoutineIndex + 1
                }`;
                return updated;
              });
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="block w-full bg-transparent font-semibold text-[#f0e6d0] outline-none"
        />
      </span>
      <button
        type="button"
        onClick={() => setRoutineMenuOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={routineMenuOpen}
        className="shrink-0 rounded-lg p-1.5 text-white/60 hover:bg-white/5 hover:text-white/80 active:scale-[0.97] transition"
      >
        <ChevronDown
          size={16}
          className={`transition-transform ${
            routineMenuOpen ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>

    {routineMenuOpen && (
      <div
        role="listbox"
        className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-white/15 bg-black/95 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
      >
        <div className="max-h-56 overflow-y-auto py-1">
          {routinesArray.length <= 1 ? (
            <div className="px-3 py-3 text-xs text-white/45">
              No other routines available
            </div>
          ) : (
            routinesArray.map((routine, index) => {
              const isSelected = index === activeRoutineIndex;
              return (
                <button
                  key={index}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setActiveRoutineIndex(index);
                    setExpandedDayIndex(null);
                    setExpandedExercises({});
                    setRoutineMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-stone-400/15 text-stone-200"
                      : "text-white/85 hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 break-words">
                      {routine.name || `Routine ${index + 1}`}
                    </span>
                    {isSelected && (
                      <span className="shrink-0 text-stone-300">✓</span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-white/10">
          <button
            type="button"
            onClick={addRoutine}
            className="w-full px-3 py-2.5 text-left text-sm text-stone-300 hover:bg-white/5 active:scale-[0.99] transition"
          >
            + Add routine
          </button>
        </div>
      </div>
    )}
  </div>

  {/* Undo last program edit */}
  <button
    type="button"
    onClick={undoLastChange}
    disabled={!canUndo}
    title="Undo last change across the whole program"
    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl backdrop-blur-md border transition active:scale-[0.97] ${
      canUndo
        ? "bg-black/60 text-stone-200 border-stone-400/45 hover:bg-black/70"
        : "bg-black/40 text-white/25 border-white/10 cursor-not-allowed"
    }`}
  >
    <Undo2 size={15} />
    <span className="text-xs font-medium hidden sm:inline">Undo all</span>
  </button>

  {/* RIGHT — Delete routine */}
  <button
    type="button"
    onClick={deleteActiveRoutine}
    className="inline-flex items-center justify-center px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-md text-red-400 border border-white/10 hover:bg-black/70 hover:text-red-300 active:scale-[0.97] transition"
  >
    <Trash2 size={16} />
  </button>
</div>

{!routinesArray.length ? (
  <div className="text-white/50 text-sm mt-4">
    No routines yet. Create one to begin.
  </div>
) : !selectedRoutineData ? (
  <div className="text-white/50 text-sm mt-4">
    No data available. Try importing backup.
  </div>
) : (
  <>
    {/* existing UI */}
  </>
)}
{selectedRoutineData && selectedRoutineData.days && (
  <div className="mb-4 space-y-3">
    {selectedRoutineData.days.map((day, dayIndex) => (
      <div
      key={dayIndex}
      className={`group rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.992]
  ${
    expandedDayIndex === dayIndex
      ? "border-stone-400/50 bg-black/40 backdrop-blur-md shadow-[0_0_28px_rgba(168,162,158,0.18)]"
      : "border-white/10 bg-black/40 backdrop-blur-md shadow-[0_0_12px_rgba(0,0,0,0.25)] hover:border-stone-400/30"
  }`}
        onClick={() =>
          setExpandedDayIndex(
            expandedDayIndex === dayIndex ? null : dayIndex
          )
        }
      >
        <div className="flex items-center gap-3 px-5 py-5">
<div className="flex items-center gap-4 flex-1">

  <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full border border-stone-400/40 text-[11px] font-semibold text-stone-300/80">
    {String(dayIndex + 1).padStart(2, "0")}
  </div>

  <input
    type="text"
    value={day.name ?? ""}
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => {
      const value = e.target.value;
      setDraftProgram((prev) => {
        const updated = JSON.parse(JSON.stringify(prev));
        updated.routines[activeRoutineIndex].days[dayIndex].name = value;
        return updated;
      }, { coalesce: true });
    }}
    onBlur={(e) => {
      if (!e.target.value.trim()) {
        setDraftProgram((prev) => {
          const updated = JSON.parse(JSON.stringify(prev));
          updated.routines[activeRoutineIndex].days[dayIndex].name = `Day ${
            dayIndex + 1
          }`;
          return updated;
        });
      }
    }}
    className="bg-transparent text-white text-lg font-semibold outline-none w-full"
  />
</div>
  <div className="flex items-center gap-4 ml-auto text-white/40">
  <button
  onClick={(e) => {
    e.stopPropagation();

    if (dayIndex === 0) return;

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    const days = routinesArray[activeRoutineIndex].days;

    [days[dayIndex - 1], days[dayIndex]] =
      [days[dayIndex], days[dayIndex - 1]];

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="text-xs text-white/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
>
  ↑
</button>

<button
  onClick={(e) => {
    e.stopPropagation();

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    const days = routinesArray[activeRoutineIndex].days;

    if (dayIndex === days.length - 1) return;

    [days[dayIndex + 1], days[dayIndex]] =
      [days[dayIndex], days[dayIndex + 1]];

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="text-xs text-white/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
>
  ↓
</button>

  <button
    onClick={(e) => {
      e.stopPropagation();
setDraftProgram((prev) => {
  const updated = JSON.parse(JSON.stringify(prev));

  const days =
    updated.routines[activeRoutineIndex].days;

  if (days.length === 1) {
    alert("At least one day is required.");
    return prev;
  }

  days.splice(dayIndex, 1);

  return updated;
});
    }}
    className="text-red-400 hover:text-red-300 transition-all duration-200 active:scale-[0.98]"
  >
    <Trash2 size={16} />
  </button>
</div>

</div>
<div className="px-5 pb-4 flex items-center justify-between text-xs text-white/35">
  <div>
    {String(day.mode || "").toLowerCase() === "amrap"
      ? `AMRAP ${day.amrapDurationMinutes || 20} min · ${day.exercises?.length || 0} in circuit`
      : `${day.exercises?.length || 0} exercises`}
  </div>

  <div className="text-[#c7a86a]/70">
    {expandedDayIndex === dayIndex ? "Collapse" : "Expand"}
  </div>
</div>
        {/* Expanded section */}
        {expandedDayIndex === dayIndex && (
  <div className="mt-3 space-y-2 animate-fadeSlide">
<div
  className="mx-3 mb-2 rounded-2xl border border-white/10 bg-black/30 p-3"
  onClick={(e) => e.stopPropagation()}
>
  <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/45">
    Day type
  </div>
  <div className="mb-3 flex gap-2">
    {[
      { id: "straight", label: "Straight sets" },
      { id: "amrap", label: "AMRAP circuit" },
    ].map((option) => {
      const selected = String(day.mode || "straight") === option.id;
      return (
        <button
          key={option.id}
          type="button"
          onClick={() => {
            setDraftProgram((prev) => {
              const updated = JSON.parse(JSON.stringify(prev));
              const target =
                updated.routines[activeRoutineIndex].days[dayIndex];
              target.mode = option.id;
              if (option.id === "amrap" && !target.amrapDurationMinutes) {
                target.amrapDurationMinutes = 20;
              }
              return updated;
            });
          }}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm transition ${
            selected
              ? "border-[#c7a86a66] bg-[#c7a86a22] text-[#f5e7c8]"
              : "border-white/10 bg-black/40 text-white/60"
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
  {String(day.mode || "").toLowerCase() === "amrap" && (
    <div className="flex items-center gap-3">
      <label className="text-sm text-white/60">Duration (min)</label>
      <input
        type="number"
        min={1}
        max={180}
        value={day.amrapDurationMinutes ?? 20}
        onChange={(e) => {
          const value = Math.max(1, Number(e.target.value) || 1);
          setDraftProgram((prev) => {
            const updated = JSON.parse(JSON.stringify(prev));
            updated.routines[activeRoutineIndex].days[
              dayIndex
            ].amrapDurationMinutes = value;
            return updated;
          }, { coalesce: true });
        }}
        className="w-20 rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-center text-sm text-white"
      />
      <div className="text-xs text-white/40">
        Exercises below are one circuit
      </div>
    </div>
  )}
</div>
{day.exercises?.map((exercise, exIndex) => (
  <div
  key={exIndex}
  className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden"
>
    <div
  onClick={(e) => {
    e.stopPropagation();

    const key = `${dayIndex}-${exIndex}`;

    setExpandedExercises((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }}
  className="flex items-start gap-3 p-4 cursor-pointer"
>
  {(() => {
    const imageKey = `${dayIndex}-${exIndex}`;
    const isUploading = uploadingImageKey === imageKey;
    const previewSrc = getExerciseImage(exercise);
    const hasCustomImage = Boolean(exercise.image);

    return (
      <div
        className="shrink-0 w-14 flex flex-col items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={isUploading}
          onClick={() => openExerciseImagePicker(dayIndex, exIndex)}
          className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/50 transition active:scale-[0.97] disabled:opacity-60"
          title={hasCustomImage ? "Replace image" : "Upload image"}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-white/35">
              <ImagePlus size={18} />
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 text-center text-[9px] uppercase tracking-wide text-white/80">
            {isUploading ? "..." : hasCustomImage ? "Change" : "Add"}
          </span>
        </button>
        {hasCustomImage && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => removeExerciseImage(dayIndex, exIndex)}
            className="text-[10px] text-red-300/80 hover:text-red-300 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    );
  })()}
  <div className="min-w-0 flex-1 transition-transform duration-150 active:scale-[0.985]">
    <input
      type="text"
      value={exercise.name ?? ""}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const value = e.target.value;
        updateExerciseAt(
          dayIndex,
          exIndex,
          (ex) => {
            ex.name = value;
          },
          { coalesce: true }
        );
      }}
      onBlur={(e) => {
        setTimeout(() => {
          const rawName = e.target.value.trim();
          const nextName = rawName || "New Exercise";

          updateExerciseAt(dayIndex, exIndex, (ex) => {
            ex.name = nextName;

            if (!rawName || rawName === "New Exercise") return;
            if (!isBlankPrescription(ex)) return;

            const latest = findLatestHistoryExercise(
              workoutHistory,
              nextName
            );
            if (!latest) return;

            const prefills = setsFromHistoryExercise(latest.exercise);
            if (!prefills.length) return;

            ex.sets = prefills;
            ex.loggingMode = inferLoggingMode({
              ...ex,
              sets: prefills,
              loggingMode: undefined,
            });
          });

          setSearchTerm("");
        }, 150);
      }}
      className="bg-transparent text-white text-lg font-semibold outline-none w-full"
    />
    <div className="mt-1 text-[11px] text-white/40 leading-snug">
      {summarizeExerciseSets(exercise)}
      {!expandedExercises[`${dayIndex}-${exIndex}`] &&
        (() => {
          const latest = findLatestHistoryExercise(
            workoutHistory,
            exercise.name
          );
          if (!latest || !isBlankPrescription(exercise)) return null;
          return (
            <span className="text-[#c7a86a]/70">
              {" "}
              · last {formatHistoryDate(latest.workout)} available
            </span>
          );
        })()}
    </div>
  </div>
  <div className="text-xs text-white/40 px-1 pt-1">
    {expandedExercises[`${dayIndex}-${exIndex}`] ? "▲" : "▼"}
  </div>
<button
  onClick={(e) => {
    e.stopPropagation();

    if (exIndex === 0) return;

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    const exercises =
      routinesArray[activeRoutineIndex].days[dayIndex].exercises;

    [exercises[exIndex - 1], exercises[exIndex]] =
      [exercises[exIndex], exercises[exIndex - 1]];

    updated.routines = routinesArray;
    clearExerciseUndoStacks(`${activeRoutineIndex}:${dayIndex}:`);
    setDraftProgram(updated);
  }}
  className="text-xs text-white/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
>
  ↑
</button>

<button
  onClick={(e) => {
    e.stopPropagation();

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    const exercises =
      routinesArray[activeRoutineIndex].days[dayIndex].exercises;

    if (exIndex === exercises.length - 1) return;

    [exercises[exIndex + 1], exercises[exIndex]] =
      [exercises[exIndex], exercises[exIndex + 1]];

    updated.routines = routinesArray;
    clearExerciseUndoStacks(`${activeRoutineIndex}:${dayIndex}:`);
    setDraftProgram(updated);
  }}
  className="text-xs text-white/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
>
  ↓
</button>

<button
  onClick={(e) => {
  e.stopPropagation();

  if (!confirm("Delete this exercise and all its sets?")) return;

  const currentExercises =
    draftProgram?.routines?.[activeRoutineIndex]?.days?.[dayIndex]
      ?.exercises || [];
  if (currentExercises.length === 1) {
    alert("At least one exercise is required.");
    return;
  }

  clearExerciseUndoStacks(`${activeRoutineIndex}:${dayIndex}:`);
  setDraftProgram((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));
    updated.routines[activeRoutineIndex].days[dayIndex].exercises.splice(
      exIndex,
      1
    );
    return updated;
  });
}}
  className="text-red-400 hover:text-red-300 transition transition-all duration-200 active:scale-[0.98]"
>
  <Trash2 size={16} />
</button>
    </div>

{expandedExercises[`${dayIndex}-${exIndex}`] && (() => {
  const exerciseKey = `${dayIndex}-${exIndex}`;
  const loggingMode = inferLoggingMode(exercise);
  const modeMeta = getLoggingModeMeta(loggingMode);
  const sets = exercise.sets || [];
  const latestHistory = findLatestHistoryExercise(
    workoutHistory,
    exercise.name
  );
  const historySets = latestHistory
    ? setsFromHistoryExercise(latestHistory.exercise)
    : [];

  const exerciseCanUndo = canUndoExercise(dayIndex, exIndex);
  const modeSummary = modeMeta.label;
  const weightDialValues = buildSettingsWeightDialValues(loggingMode, sets);
  const repDialValues = buildSettingsRepDialValues(loggingMode, sets);
  const loadUnit =
    loggingMode === "band" || loggingMode === "time" ? "" : "kg";
  const valueUnit = loggingMode === "time" ? "s" : "";

  return (
  <div
    className="mt-3 space-y-2 px-4 pb-4 animate-fadeSlide"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="flex items-center justify-between gap-2 px-0.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
        Exercise edits
      </div>
      <button
        type="button"
        onClick={() => undoExerciseAt(dayIndex, exIndex)}
        disabled={!exerciseCanUndo}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition active:scale-[0.97] ${
          exerciseCanUndo
            ? "border-[#c7a86a55] bg-[#c7a86a12] text-[#d7c7a4] hover:bg-[#c7a86a]/15"
            : "border-white/10 bg-black/30 text-white/25 cursor-not-allowed"
        }`}
      >
        <Undo2 size={13} />
        Undo
      </button>
    </div>

    {latestHistory && historySets.length > 0 && (
      <EditorSection
        title="Last session"
        summary={`${formatHistoryDate(latestHistory.workout)} · ${summarizeExerciseSets({
          name: exercise.name,
          sets: historySets,
        })}`}
        open={isEditorSectionOpen(exerciseKey, "lastSession")}
        onToggle={() => toggleEditorSection(exerciseKey, "lastSession")}
      >
        <button
          type="button"
          onClick={() => {
            const blank = isBlankPrescription(exercise);
            if (
              !blank &&
              !confirm(
                `Replace current sets with last session (${formatHistoryDate(
                  latestHistory.workout
                )})?`
              )
            ) {
              return;
            }

            updateExerciseAt(dayIndex, exIndex, (ex) => {
              ex.sets = historySets.map((set) => ({ ...set }));
              ex.loggingMode = inferLoggingMode({
                ...ex,
                sets: historySets,
                loggingMode: undefined,
              });
            });
          }}
          className="w-full rounded-xl border border-[#c7a86a33] bg-[#c7a86a12] px-3 py-2.5 text-left transition active:scale-[0.99] hover:bg-[#c7a86a]/15"
        >
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#c7a86a]/70">
            {formatHistoryDate(latestHistory.workout)}
          </div>
          <div className="mt-0.5 text-xs text-[#d7c7a4]">
            {summarizeExerciseSets({
              name: exercise.name,
              sets: historySets,
            })}
            <span className="text-white/35"> · tap to apply</span>
          </div>
        </button>
      </EditorSection>
    )}

    <EditorSection
      title="Mode"
      summary={modeSummary}
      open={isEditorSectionOpen(exerciseKey, "mode")}
      onToggle={() => toggleEditorSection(exerciseKey, "mode")}
    >
      <div className="flex gap-1 rounded-xl border border-white/20 bg-black/40 p-1">
        {LOGGING_MODES.map((mode) => {
          const selected = loggingMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                updateExerciseAt(dayIndex, exIndex, (ex) => {
                  ex.loggingMode = mode.id;
                  ex.sets = applyLoggingModeToSets(ex.sets || [], mode.id);
                });
              }}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition active:scale-[0.98] ${
                selected
                  ? "bg-[#c7a86a] text-black shadow-[0_0_12px_rgba(199,168,106,0.35)]"
                  : "text-white/70 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </EditorSection>

    <div className="rounded-xl border border-[#c7a86a66] bg-black/35 px-3 py-3 space-y-2.5 shadow-[0_0_0_1px_rgba(199,168,106,0.12)]">
      <div className="text-[10px] uppercase tracking-[0.14em] text-[#d7c7a4]/80">
        Sets
      </div>

      <div className="space-y-2">
        {sets.map((set, setIndex) => (
          <div
            key={setIndex}
            className="rounded-xl border border-white/20 bg-black/40 px-2.5 py-2"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="h-7 w-7 rounded-full border border-[#c7a86a40] bg-[#c7a86a12] flex items-center justify-center text-xs font-semibold text-[#d7c7a4]">
                {setIndex + 1}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!confirm("Delete this set?")) return;
                  updateExerciseAt(dayIndex, exIndex, (ex) => {
                    if ((ex.sets || []).length <= 1) {
                      alert("At least one set is required.");
                      return;
                    }
                    ex.sets.splice(setIndex, 1);
                  });
                }}
                className="flex items-center justify-center text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div
              className={`grid gap-2 ${
                modeMeta.showLoad || loggingMode === "bodyweight"
                  ? "grid-cols-2"
                  : "grid-cols-1"
              }`}
            >
              {loggingMode === "bodyweight" ? (
                <div className="flex h-[108px] items-center justify-center rounded-xl border border-white/25 bg-black/50 text-xl font-semibold text-white">
                  BW
                </div>
              ) : modeMeta.showLoad ? (
                <WheelDial
                  values={weightDialValues}
                  value={
                    loggingMode === "band"
                      ? normalizeBandLabel(set.weight || "")
                      : set.weight || ""
                  }
                  unit={loadUnit}
                  onChange={(next) => {
                    updateExerciseAt(dayIndex, exIndex, (ex) => {
                      ex.sets[setIndex].weight =
                        loggingMode === "band"
                          ? normalizeBandLabel(next)
                          : next;
                    });
                  }}
                  className="rounded-xl border border-white/25 bg-black/50"
                />
              ) : null}

              <WheelDial
                values={repDialValues}
                value={set.reps ?? ""}
                unit={valueUnit}
                onChange={(next) => {
                  updateExerciseAt(dayIndex, exIndex, (ex) => {
                    ex.sets[setIndex].reps = next;
                  });
                }}
                className="rounded-xl border border-white/25 bg-black/50"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            updateExerciseAt(dayIndex, exIndex, (ex) => {
              ex.sets = ex.sets || [];
              ex.sets.push(createEmptySet(loggingMode));
            });
          }}
          className="flex-1 rounded-xl border border-[#c7a86a66] bg-[#c7a86a12] py-2 text-xs text-[#d7c7a4] hover:bg-[#c7a86a]/15 transition-all duration-200 active:scale-[0.98]"
        >
          + Add Set
        </button>
        <button
          type="button"
          onClick={() => {
            updateExerciseAt(dayIndex, exIndex, (ex) => {
              const list = ex.sets || [];
              const last = list[list.length - 1];
              list.push(createEmptySet(loggingMode, last || null));
              ex.sets = list;
            });
          }}
          className="flex-1 rounded-xl border border-white/25 bg-black/40 py-2 text-xs text-white/80 hover:bg-white/5 transition-all duration-200 active:scale-[0.98]"
        >
          Duplicate Last
        </button>
      </div>
    </div>
  </div>
  );
})()}
</div>
  ))}
    <button
  onClick={(e) => {
    e.stopPropagation();

   const nextIndex =
     draftProgram?.routines?.[activeRoutineIndex]?.days?.[dayIndex]
       ?.exercises?.length || 0;

   setDraftProgram((prev) => {
  const updated = JSON.parse(JSON.stringify(prev));

  updated.routines[activeRoutineIndex]
    .days[dayIndex]
    .exercises.push({
      name: "",
      loggingMode: "load",
      sets: [createEmptySet("load")]
    });

  return updated;
});

   setExpandedExercises((prev) => ({
     ...prev,
     [`${dayIndex}-${nextIndex}`]: true,
   }));
  }}
  className="mt-4 w-full rounded-2xl border border-[#c7a86a33] bg-[#c7a86a12] py-3 text-sm text-[#d7c7a4] hover:bg-[#c7a86a]/15 transition-all duration-200 active:scale-[0.98]"
>
  + Add Exercise
</button>
          </div>
        )}
      </div>
    ))}
  </div>
)}

<button
  onClick={(e) => {
    e.stopPropagation();

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    routinesArray[activeRoutineIndex].days.push({
      name: `Day ${routinesArray[activeRoutineIndex].days.length + 1}`,
      mode: "straight",
      amrapDurationMinutes: 20,
      exercises: []
    });

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="mt-1 w-full rounded-2xl border border-[#c7a86a55] bg-black/55 backdrop-blur-md py-3 text-sm text-[#d7c7a4] hover:bg-black/40 active:scale-[0.98] transition-all duration-200"
>
  + Add Day
</button>


      <div className="mt-6 mb-4 rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-4">

        <button
          type="button"
          onClick={openProgramExport}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-400/40 bg-stone-500/10 px-4 py-3 text-sm font-medium text-stone-100 transition-all duration-200 active:scale-[0.98]"
        >
          <Download size={16} />
          Download program (.txt)
        </button>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <button
            onClick={() => {
              const backupData = {
                workoutPlans: data,
                workoutHistory,
                activeWorkoutState: JSON.parse(
                  localStorage.getItem("active-workout-state") || "{}"
                ),
                selectedRoutine,
                selectedDay,
                exportDate: new Date().toISOString(),
                version: 1,
              };

              const json = JSON.stringify(backupData, null, 2);

              const blob = new Blob([json], {
                type: "application/json",
              });

              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");

              const date = new Date().toISOString().slice(0, 10);

              link.href = url;
              link.download = `workout-backup-${date}.json`;

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              URL.revokeObjectURL(url);
            }}
            className="rounded-2xl border border-stone-400/35 bg-stone-500/10 p-3 text-sm font-medium text-stone-100 transition-all duration-200 active:scale-[0.98]"
          >
            Export Backup
          </button>

          <button
            onClick={() => {
              document
                .getElementById("backup-import-input")
                ?.click();
            }}
            className="rounded-2xl border border-blue-500/30 bg-blue-600/20 p-3 text-sm font-medium text-blue-300 transition-all duration-200 active:scale-[0.98]"
          >
            Import Backup
          </button>
          <button
            onClick={handleUploadToCloud}
            className="rounded-2xl bg-green-600/80 p-3 text-sm font-medium text-white transition-all duration-200 hover:bg-green-500 active:scale-[0.98]"
          >
            Cloud Upload
          </button>
        </div>
        

<button
  disabled
className={`mt-4 w-full rounded-2xl p-3 text-sm font-medium text-white ${
  "bg-black/60 backdrop-blur-md"
} ${saveStatus === "saving" ? "opacity-60 cursor-not-allowed" : ""}`}
>
{
  saveStatus === "saving"
    ? "Saving..."
    : saveStatus === "Saved"
    ? "Saved ✓"
    : "All changes saved"
}
</button>

        <input
          id="backup-import-input"
          type="file"
          accept=".json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = (e) => {
              try {
                const parsed = JSON.parse(e.target.result);

                if (
                  !parsed.workoutPlans ||
                  !parsed.workoutHistory ||
                  parsed.selectedRoutine === undefined ||
                  parsed.selectedDay === undefined
                ) {
                  alert("Invalid backup file");
                  return;
                }

                const importedPlans = parsed.workoutPlans;
                
                if (
                  importedPlans?.routines &&
                  !Array.isArray(importedPlans.routines)
                ) {
                  importedPlans.routines =
                  Object.values(importedPlans.routines);
                }
                localStorage.setItem(
                  "workout-app-data",
                  JSON.stringify(importedPlans)
                );

                localStorage.setItem(
                  "workout-history",
                  JSON.stringify(parsed.workoutHistory)
                );

                localStorage.setItem(
                  "active-workout-state",
                  JSON.stringify(parsed.activeWorkoutState || {})
                );

                localStorage.setItem(
                  "selected-routine",
                  String(parsed.selectedRoutine)
                );

                localStorage.setItem(
                  "selected-day",
                  String(parsed.selectedDay)
                );

                alert("Backup restored. The app will now reload.");
                window.location.reload();
              } catch {
                alert("Invalid backup file");
              }
            };

            reader.readAsText(file);

            event.target.value = "";
          }}
        />
      </div>

      {showProgramExport ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 backdrop-blur-sm sm:items-center">
          <div className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-400/35 bg-[#0c0c0c] p-4 shadow-2xl shadow-black/60">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-white">
                  Download program
                </div>
                <div className="mt-0.5 text-xs text-stone-400">
                  Readable .txt — not a restore backup
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProgramExport(false)}
                className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-3 space-y-2">
              {[
                { id: "all-routines", label: "All routines" },
                { id: "selected-routines", label: "Selected routines" },
                { id: "routine-days", label: "Days in a routine" },
                { id: "catalog-all", label: "All exercises (catalog)" },
                {
                  id: "catalog-routine",
                  label: "Exercises in one routine",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setExportScope(opt.id);
                    setExportNotice("");
                    if (opt.id === "selected-routines" && !exportRoutineIndexes.length) {
                      setExportRoutineIndexes(routinesArray.map((_, i) => i));
                    }
                    if (opt.id === "routine-days") {
                      setExportDayRoutineIndex(activeRoutineIndex);
                      setExportDayIndexes(
                        (routinesArray[activeRoutineIndex]?.days || []).map(
                          (_, i) => i
                        )
                      );
                    }
                  }}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition active:scale-[0.99] ${
                    exportScope === opt.id
                      ? "border-stone-400/60 bg-stone-400/15 text-stone-100"
                      : "border-white/10 bg-black/30 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {exportScope === "selected-routines" ? (
              <div className="mb-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-stone-400">
                  Routines
                </div>
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {routinesArray.map((routine, index) => {
                    const checked = exportRoutineIndexes.includes(index);
                    return (
                      <label
                        key={index}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExportRoutine(index)}
                          className="accent-stone-300"
                        />
                        <span className="min-w-0 break-words text-sm text-white/85">
                          {routine?.name || `Routine ${index + 1}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {exportScope === "routine-days" ? (
              <div className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                <div>
                  <div className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-stone-400">
                    Routine
                  </div>
                  <select
                    value={exportDayRoutineIndex}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setExportDayRoutineIndex(next);
                      setExportDayIndexes(
                        (routinesArray[next]?.days || []).map((_, i) => i)
                      );
                    }}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                  >
                    {routinesArray.map((routine, index) => (
                      <option key={index} value={index}>
                        {routine?.name || `Routine ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400">
                      Days
                    </div>
                    <button
                      type="button"
                      className="text-[11px] text-stone-300"
                      onClick={() =>
                        setExportDayIndexes(
                          (exportDayRoutine?.days || []).map((_, i) => i)
                        )
                      }
                    >
                      Select all
                    </button>
                  </div>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto">
                    {(exportDayRoutine?.days || []).map((day, index) => {
                      const checked = exportDayIndexes.includes(index);
                      return (
                        <label
                          key={index}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleExportDay(index)}
                            className="accent-stone-300"
                          />
                          <span className="min-w-0 break-words text-sm text-white/85">
                            {day?.name || `Day ${index + 1}`}
                            <span className="text-white/40">
                              {" "}
                              · {day?.exercises?.length || 0} ex
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {exportScope === "catalog-routine" ? (
              <div className="mb-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-stone-400">
                  Routine
                </div>
                <select
                  value={exportCatalogRoutineIndex}
                  onChange={(e) =>
                    setExportCatalogRoutineIndex(Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                >
                  {routinesArray.map((routine, index) => (
                    <option key={index} value={index}>
                      {routine?.name || `Routine ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {exportNotice ? (
              <div className="mb-3 text-center text-xs text-stone-300">
                {exportNotice}
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={exportBusy}
                onClick={handleProgramDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-400/45 bg-stone-400/15 py-3 text-sm font-medium text-stone-100 active:scale-[0.98] disabled:opacity-50"
              >
                <Download size={15} />
                Download
              </button>
              <button
                type="button"
                disabled={exportBusy}
                onClick={handleProgramCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white/85 active:scale-[0.98] disabled:opacity-50"
              >
                <Copy size={15} />
                Copy
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}