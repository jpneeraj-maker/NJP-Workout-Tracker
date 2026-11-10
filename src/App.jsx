import { supabase } from "./supabaseClient";
import { useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import LandingPage from "./pages/LandingPage";
import WorkoutPreviewPage from "./pages/WorkoutPreviewPage";
import WorkoutPage from "./pages/WorkoutPage";
import SettingsPage from "./pages/SettingsPage";
import HistoryPage from "./pages/HistoryPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { workoutData } from "./workoutData.js";
import {
  createStretchEntry,
  formatDurationSeconds,
  formatHistorySessionTitle,
  getAmrapDurationMinutes,
  getLocalSaveKey,
  isAmrapDay,
  loadStretchRoutineNames,
  rememberStretchRoutineName,
  upsertDayStretch,
} from "./schema.js";

import appBackground from "./app-background.png";
import {
  playFootballWhistle,
  playRestBeep,
  preloadWorkoutSounds,
} from "./sounds";

function SortableExerciseCard({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="mb-4"
    >
      {children(listeners)}
    </div>
  );
}
function App() {

const defaultProgram = {
  routines: {
    0: {
      days: [
        { name: "Push A", exercises: [] },
        { name: "Pull A", exercises: [] },
        { name: "Legs", exercises: [] },
        { name: "Push B", exercises: [] },
        { name: "Pull B", exercises: [] }
      ]
    }
  }
};

const [data, setData] = useState(defaultProgram);
const [isDataLoaded, setIsDataLoaded] = useState(false);
const [hasLoadedCloudData, setHasLoadedCloudData] = useState(false);

const [selectedRoutine, setSelectedRoutine] = useState(() => {
  const saved = localStorage.getItem("selected-routine");
  return saved ? saved : "0";
});
  const [selectedDay, setSelectedDay] = useState(() => {
  const saved = localStorage.getItem("selected-day");
  return saved ? Number(saved) : 0;
});
const savedWorkoutState = JSON.parse(
  localStorage.getItem("active-workout-state") || "{}"
);
const [workoutMode, setWorkoutMode] = useState(
  savedWorkoutState.workoutMode ?? false
);

const [isPausedWorkout, setIsPausedWorkout] = useState(
  savedWorkoutState.isPaused === true
);

const [settingsSource, setSettingsSource] = useState(null);

const [transitionDirection, setTransitionDirection] = useState("forward");
const [isTransitioning, setIsTransitioning] = useState(false);
function navigateWithTransition(callback, direction = "forward") {
  setTransitionDirection(direction);
  setIsTransitioning(true);

  setTimeout(() => {
    callback();
    setIsTransitioning(false);
  }, 250);
}

const [activeWorkoutScreen, setActiveWorkoutScreen] = useState(
  savedWorkoutState.activeWorkoutScreen ?? null
);

// possible values: "active", "rest-set", "rest-exercise", "summary"

const [activeExerciseIndex, setActiveExerciseIndex] = useState(
  savedWorkoutState.activeExerciseIndex ?? 0
);

const [activeSetIndex, setActiveSetIndex] = useState(
  savedWorkoutState.activeSetIndex ?? 0
);

const [workoutStartTime, setWorkoutStartTime] = useState(
  savedWorkoutState.workoutStartTime ?? null
);
const [workoutSeconds, setWorkoutSeconds] = useState(0);

const [finalWorkoutSeconds, setFinalWorkoutSeconds] = useState(
  savedWorkoutState.finalWorkoutSeconds ?? 0
);

const [restSeconds, setRestSeconds] = useState(
  savedWorkoutState.restSeconds ?? 60
);

const [restPaused, setRestPaused] = useState(
  savedWorkoutState.restPaused ?? false
);

const [skippedSets, setSkippedSets] = useState(
  savedWorkoutState.skippedSets ?? 0
);

const [showEndWorkoutConfirm, setShowEndWorkoutConfirm] = useState(false);
const [endWorkoutBusy, setEndWorkoutBusy] = useState(false);

const [workoutHistory, setWorkoutHistory] = useState(() => {
  const saved = localStorage.getItem("workout-history");
  return saved ? JSON.parse(saved) : [];
});

const [expandedHistoryIndex, setExpandedHistoryIndex] = useState(null);

const [activeScreen, setActiveScreen] = useState(
  savedWorkoutState.activeScreen ?? "landing"
);

const [activeTab, setActiveTab] = useState(
  savedWorkoutState.activeTab ?? "workout"
);

const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(null);

const [showLastWorkout, setShowLastWorkout] = useState(false);
const [completedWorkoutName, setCompletedWorkoutName] = useState("");
const [completedWorkout, setCompletedWorkout] = useState(null);
const [completedStretch, setCompletedStretch] = useState(null);
const [stretchSeconds, setStretchSeconds] = useState(0);
const [stretchStartTime, setStretchStartTime] = useState(null);
const [stretchRoutineName, setStretchRoutineName] = useState("");
const [stretchOnlyMode, setStretchOnlyMode] = useState(false);
const [stretchRoutineNames, setStretchRoutineNames] = useState(() =>
  loadStretchRoutineNames()
);

const [amrapCircuitsCompleted, setAmrapCircuitsCompleted] = useState(
  savedWorkoutState.amrapCircuitsCompleted ?? 0
);
const [amrapSecondsRemaining, setAmrapSecondsRemaining] = useState(
  savedWorkoutState.amrapSecondsRemaining ?? 0
);
const [amrapPartialEntries, setAmrapPartialEntries] = useState(
  savedWorkoutState.amrapPartialEntries ?? []
);

useEffect(() => {
  localStorage.setItem(
    "active-workout-state",
    JSON.stringify({
      workoutMode,
      activeWorkoutScreen,
      activeExerciseIndex,
      activeSetIndex,
      workoutStartTime,
      workoutSeconds,
      restSeconds,
      restPaused,
      skippedSets,
      activeScreen,
      activeTab,
      finalWorkoutSeconds,
      isPaused: isPausedWorkout,
      selectedRoutine,
      selectedDay,
      pausedAt: isPausedWorkout ? Date.now() : null,
      amrapCircuitsCompleted,
      amrapSecondsRemaining,
      amrapPartialEntries,
    })
  );
}, [
  workoutMode,
  activeWorkoutScreen,
  activeExerciseIndex,
  activeSetIndex,
  workoutStartTime,
  workoutSeconds,
  restSeconds,
  restPaused,
  skippedSets,
  activeScreen,
  activeTab,
  finalWorkoutSeconds,
  isPausedWorkout,
  selectedRoutine,
  selectedDay,
  amrapCircuitsCompleted,
  amrapSecondsRemaining,
  amrapPartialEntries,
]);

  useEffect(() => {
    localStorage.setItem("workout-app-data", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
  console.log("DATA CHANGED", data);
}, [data]);

  useEffect(() => {
async function loadData() {
  try {
    console.log("LOAD STARTED");

    const { data: row, error } = await supabase
      .from("workout_data")
      .select("data")
      .eq("user_id", "default-user")
      .maybeSingle();

    if (error) throw error;
console.log("SUPABASE DATA:", row?.data);

const stored = localStorage.getItem("workout-app-data");
const localData = stored ? JSON.parse(stored) : null;

console.log("LOCAL DATA:", localData);

const supabaseData = row?.data;
const cloudWorkoutPlans = supabaseData?.workoutPlans;
const cloudWorkoutHistory = supabaseData?.workoutHistory;
const cloudSelectedRoutine = supabaseData?.selectedRoutine;
const cloudSelectedDay = supabaseData?.selectedDay;
const cloudWorkoutState = supabaseData?.activeWorkoutState;

const hasSupabaseData =
  !!cloudWorkoutPlans?.routines &&
  Object.keys(cloudWorkoutPlans.routines || {}).length > 0;

const hasLocalData =
  localData &&
  localData.routines &&
  Object.keys(localData.routines).length > 0;

// choose richer dataset
console.log("SETTING DATA FROM: SUPABASE DIRECT");

setData(cloudWorkoutPlans || defaultProgram);

if (
  cloudWorkoutHistory &&
  cloudWorkoutHistory.length > 0
) {
  setWorkoutHistory(cloudWorkoutHistory);
}

if (cloudSelectedRoutine !== undefined) {
  setSelectedRoutine(cloudSelectedRoutine);
}

if (cloudSelectedDay !== undefined) {
  setSelectedDay(cloudSelectedDay);
}

if (cloudWorkoutState?.isPaused === true) {
  if (cloudWorkoutState.activeExerciseIndex !== undefined) {
    setActiveExerciseIndex(cloudWorkoutState.activeExerciseIndex);
  }
  if (cloudWorkoutState.activeSetIndex !== undefined) {
    setActiveSetIndex(cloudWorkoutState.activeSetIndex);
  }
  if (cloudWorkoutState.workoutSeconds !== undefined) {
    setWorkoutSeconds(cloudWorkoutState.workoutSeconds);
  }
  if (cloudWorkoutState.restSeconds !== undefined) {
    setRestSeconds(cloudWorkoutState.restSeconds);
  }
  if (cloudWorkoutState.restPaused !== undefined) {
    setRestPaused(cloudWorkoutState.restPaused);
  }
  if (cloudWorkoutState.skippedSets !== undefined) {
    setSkippedSets(cloudWorkoutState.skippedSets);
  }
  if (cloudWorkoutState.workoutStartTime !== undefined) {
    setWorkoutStartTime(cloudWorkoutState.workoutStartTime);
  }
  if (cloudWorkoutState.finalWorkoutSeconds !== undefined) {
    setFinalWorkoutSeconds(cloudWorkoutState.finalWorkoutSeconds);
  }
  if (cloudWorkoutState.activeWorkoutScreen !== undefined) {
    setActiveWorkoutScreen(cloudWorkoutState.activeWorkoutScreen);
  }
  if (cloudWorkoutState.amrapCircuitsCompleted !== undefined) {
    setAmrapCircuitsCompleted(cloudWorkoutState.amrapCircuitsCompleted);
  }
  if (cloudWorkoutState.amrapSecondsRemaining !== undefined) {
    setAmrapSecondsRemaining(cloudWorkoutState.amrapSecondsRemaining);
  }
  if (cloudWorkoutState.amrapPartialEntries !== undefined) {
    setAmrapPartialEntries(cloudWorkoutState.amrapPartialEntries);
  }
  setIsPausedWorkout(true);
  setWorkoutMode(false);
}

  } catch (err) {
    console.error("Supabase load failed", err);

    const stored = localStorage.getItem("workout-app-data");
    if (stored) {
      setData(JSON.parse(stored));
    }
  } finally {
    // ✅ ALWAYS runs
    console.log("LOAD COMPLETE");
    setIsDataLoaded(true);
    setHasLoadedCloudData(true);
  }
}

  loadData();
}, []);

 useEffect(() => {
    if (!hasLoadedCloudData) return;
    const timeout = setTimeout(async () => {
      console.log("🔥 SAVE TRIGGERED", data);
const hasValidRoutines =
  data?.routines &&
  Object.keys(data.routines).length > 0;

const hasValidHistory =
  Array.isArray(workoutHistory);

if (!hasValidRoutines || !hasValidHistory) {
  console.warn("⛔ Skipping save — invalid data");
  return;
}
try {
  await supabase
    .from("workout_data")
    .update({
  data: {
    workoutPlans: data,

    workoutHistory,

    activeWorkoutState: {
      workoutMode,
      activeWorkoutScreen,
      activeExerciseIndex,
      activeSetIndex,
      workoutStartTime,
      workoutSeconds,
      restSeconds,
      restPaused,
      skippedSets,
      activeScreen,
      activeTab,
      finalWorkoutSeconds,
      isPaused: isPausedWorkout,
      pausedAt: isPausedWorkout ? Date.now() : null,
      amrapCircuitsCompleted,
      amrapSecondsRemaining,
      amrapPartialEntries,
    },

    selectedRoutine,
    selectedDay,

    exportDate: new Date().toISOString(),
    version: 1,
  },
})
    .eq("user_id", "default-user");
    } catch (err) {
      console.error("Supabase save failed", err);
    }
  }, 500);

  return () => clearTimeout(timeout);
}, [
  data,
  workoutHistory,
  selectedRoutine,
  selectedDay,
  workoutMode,
  activeWorkoutScreen,
  activeExerciseIndex,
  activeSetIndex,
  workoutStartTime,
  workoutSeconds,
  restSeconds,
  restPaused,
  skippedSets,
  activeScreen,
  activeTab,
  finalWorkoutSeconds,
  isPausedWorkout,
  amrapCircuitsCompleted,
  amrapSecondsRemaining,
  amrapPartialEntries,
]);

useEffect(() => {
  localStorage.setItem("selected-routine", selectedRoutine);
}, [selectedRoutine]);
useEffect(() => {
  localStorage.setItem("selected-day", selectedDay);
}, [selectedDay]);
useEffect(() => {
  localStorage.setItem(
    "workout-history",
    JSON.stringify(workoutHistory)
  );
}, [workoutHistory]);
useEffect(() => {
  const handlePopState = () => {
    if (activeScreen === "app") {
      setWorkoutMode(false);
      setExpandedExerciseIndex(null);
      setActiveScreen("landing");
    }
  };

  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, [activeScreen]);

useEffect(() => {
  if (
    !workoutMode ||
    activeWorkoutScreen === "summary" ||
    activeWorkoutScreen === "stretch"
  ) {
    return;
  }

  // Only pause workout clock if the user paused during a rest screen.
  const resting =
    activeWorkoutScreen === "rest-set" ||
    activeWorkoutScreen === "rest-exercise";
  if (resting && restPaused) {
    return;
  }

  if (activeWorkoutScreen === "amrap-partial") {
    return;
  }

  const interval = setInterval(() => {
    setWorkoutSeconds((prev) => prev + 1);
  }, 1000);

  return () => clearInterval(interval);
}, [workoutMode, restPaused, activeWorkoutScreen]);

useEffect(() => {
  if (!workoutMode || activeWorkoutScreen !== "stretch") {
    return;
  }

  const interval = setInterval(() => {
    setStretchSeconds((prev) => prev + 1);
  }, 1000);

  return () => clearInterval(interval);
}, [workoutMode, activeWorkoutScreen]);

const amrapCompletedRef = useRef(false);

useEffect(() => {
  if (activeWorkoutScreen === "amrap-active") {
    amrapCompletedRef.current = false;
  }
}, [activeWorkoutScreen]);

useEffect(() => {
  if (
    !workoutMode ||
    activeWorkoutScreen !== "amrap-active" ||
    isPausedWorkout
  ) {
    return;
  }

  preloadWorkoutSounds();

  const interval = setInterval(() => {
    setAmrapSecondsRemaining((prev) => {
      if (prev <= 1) {
        if (!amrapCompletedRef.current) {
          amrapCompletedRef.current = true;
          playFootballWhistle();
          queueMicrotask(() => {
            openAmrapPartialEntry();
          });
        }
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [workoutMode, activeWorkoutScreen, isPausedWorkout]);

const restCompletedRef = useRef(false);

useEffect(() => {
  if (
    activeWorkoutScreen === "rest-set" ||
    activeWorkoutScreen === "rest-exercise"
  ) {
    restCompletedRef.current = false;
  }
}, [activeWorkoutScreen]);

useEffect(() => {
  if (
    activeWorkoutScreen !== "rest-set" &&
    activeWorkoutScreen !== "rest-exercise"
  ) {
    return;
  }

  if (restPaused) {
    return;
  }

  preloadWorkoutSounds();

  const interval = setInterval(() => {
    setRestSeconds((prev) => {
      if (prev <= 1) {
        // Fire beep on the 1 → 0 tick so it isn't delayed by a later effect.
        if (!restCompletedRef.current) {
          restCompletedRef.current = true;
          playRestBeep();
          queueMicrotask(() => {
            moveToNextWorkoutStep();
          });
        }
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [activeWorkoutScreen, restPaused]);


const currentWeek = data?.routines?.[selectedRoutine] || null;

const hasData = currentWeek && currentWeek.days;

const currentDay =
  currentWeek?.days?.[selectedDay] || null;

const nextWorkoutIndex =
  selectedDay >= (currentWeek?.days?.length || 0)
    ? 0
    : selectedDay;

const displayedNextWorkout =
  (currentWeek?.days?.[nextWorkoutIndex]) || null;

const activeWeekKey = selectedRoutine;
const activeDayIndex = selectedDay;

const activeExercise =
  currentDay?.exercises?.[activeExerciseIndex] || null;

const activeSet =
  activeExercise?.sets[activeSetIndex];
const isLastSetOfExercise =
  activeExercise &&
  activeSetIndex === activeExercise.sets.length - 1;

const isLastExercise =
  (currentDay?.exercises?.length || 0) > 0 &&
  activeExerciseIndex === (currentDay?.exercises?.length || 0) - 1;

const isFinalSetOfWorkout =
  isLastSetOfExercise && isLastExercise;

const hasWeightField =
  activeSet?.plannedWeight !== "" &&
  activeSet?.plannedWeight !== null &&
  activeSet?.plannedWeight !== undefined;

  function updateSet(exerciseIndex, setIndex, field, value) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

   const exercise =
  updated.routines?.[activeWeekKey]
    ?.days?.[activeDayIndex]
    ?.exercises?.[exerciseIndex];

if (!exercise) return prev;

const set = exercise.sets?.[setIndex];

if (!set) return prev;

set[field] = value;
    return updated;

  });
}

function handleAddWeek() {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    const weekKeys = Object.keys(updated.routines);
    const lastWeekKey = weekKeys[weekKeys.length - 1];

    const lastWeek = updated.routines[lastWeekKey];
    const nextWeekNumber = Number(lastWeekKey) + 1;

    const newWeek = JSON.parse(JSON.stringify(lastWeek));

    newWeek.days.forEach((day) => {
      day.exercises.forEach((exercise) => {
        exercise.remarks = "";

        exercise.sets.forEach((set) => {
          set.actualWeight = undefined;
          set.actualReps = undefined;
        });
      });
    });

    updated.routines[nextWeekNumber] = newWeek;

    return updated;
  });

  setSelectedRoutine(String(Number(selectedRoutine) + 1));
  setSelectedDay(0);
}
function updateExerciseRemark(weekKey, dayIndex, exerciseIndex, value) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    updated.routines[weekKey].days[dayIndex].exercises[exerciseIndex].remarks = value;

    return updated;
  });
}
function handleAddExercise() {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    updated.routines[activeWeekKey].days[activeDayIndex].exercises.push({
      name: "New Exercise",
      remarks: "",
sets: [
  {
    type: "Warm Up",
    plannedWeight: "",
    targetReps: "",
    actualWeight: undefined,
    actualReps: undefined,
  },
  {
    type: "Ramp Up",
    plannedWeight: "",
    targetReps: "",
    actualWeight: undefined,
    actualReps: undefined,
  },
  {
    type: "Working Set 1",
    plannedWeight: "",
    targetReps: "",
    actualWeight: undefined,
    actualReps: undefined,
  },
  {
    type: "Working Set 2",
    plannedWeight: "",
    targetReps: "",
    actualWeight: undefined,
    actualReps: undefined,
  },
],
    });

    return updated;
  });
}
function handleRemoveExercise(exerciseIndex) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    updated.routines[activeWeekKey].days[activeDayIndex].exercises.splice(
      exerciseIndex,
      1
    );

    return updated;
  });
}
function handleRemoveSet(exerciseIndex, setIndex) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    updated.routines[activeWeekKey].days[activeDayIndex].exercises[
      exerciseIndex
    ].sets.splice(setIndex, 1);

    return updated;
  });
}
function handleAddSet(exerciseIndex) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    const sets =
      updated.routines[activeWeekKey].days[activeDayIndex].exercises[exerciseIndex]
        .sets;

    const workingSets = sets.filter((set) =>
      set.type.startsWith("Working Set")
    ).length;

    sets.push({
      type: `Working Set ${workingSets + 1}`,
      plannedWeight: "",
      targetReps: "",
      actualWeight: undefined,
      actualReps: undefined,
    });

    return updated;
  });
}
function moveSet(exerciseIndex, setIndex, direction) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    const sets =
      updated.routines[activeWeekKey].days[activeDayIndex].exercises[exerciseIndex]
        .sets;

    const newIndex = setIndex + direction;

    if (newIndex < 0 || newIndex >= sets.length) {
      return prev;
    }

    [sets[setIndex], sets[newIndex]] = [
      sets[newIndex],
      sets[setIndex],
    ];
    return updated;
  });
}
function startWorkout() {
  if (isPausedWorkout) {
    const confirmed = window.confirm(
      "You have a paused workout. Starting a new workout will discard that paused session. Continue?"
    );
    if (!confirmed) return;
  }

  playFootballWhistle();
  preloadWorkoutSounds();

  const day = data?.routines?.[selectedRoutine]?.days?.[selectedDay];
  const amrap = isAmrapDay(day);
  const durationSecs = getAmrapDurationMinutes(day) * 60;

  setIsPausedWorkout(false);
  setWorkoutMode(true);
  setActiveWorkoutScreen(amrap ? "amrap-active" : "active");

  setActiveExerciseIndex(0);
  setActiveSetIndex(0);

  const now = Date.now();
  setWorkoutStartTime(now);
  setWorkoutSeconds(0);

  setRestSeconds(60);
  setRestPaused(false);

  setSkippedSets(0);
  setAmrapCircuitsCompleted(0);
  setAmrapSecondsRemaining(amrap ? durationSecs : 0);
  setAmrapPartialEntries(
    amrap
      ? (day?.exercises || []).map((exercise) => ({
          name: exercise.name,
          loggingMode: exercise.loggingMode || null,
          plannedWeight:
            exercise.sets?.[0]?.plannedWeight ??
            exercise.sets?.[0]?.weight ??
            "",
          targetReps:
            exercise.sets?.[0]?.targetReps ?? exercise.sets?.[0]?.reps ?? "",
          actualWeight: "",
          actualReps: "",
        }))
      : []
  );

  setCompletedWorkout(null);
  setCompletedWorkoutName("");
  setFinalWorkoutSeconds(0);

  setShowEndWorkoutConfirm(false);
}
function buildActiveWorkoutState({
  paused = isPausedWorkout,
  mode = workoutMode,
  screen = activeWorkoutScreen,
  seconds = workoutSeconds,
  rest = restSeconds,
  restIsPaused = restPaused,
  circuits = amrapCircuitsCompleted,
  amrapRemaining = amrapSecondsRemaining,
  partialEntries = amrapPartialEntries,
} = {}) {
  return {
    workoutMode: mode,
    activeWorkoutScreen: screen,
    activeExerciseIndex,
    activeSetIndex,
    workoutStartTime,
    workoutSeconds: seconds,
    restSeconds: rest,
    restPaused: restIsPaused,
    skippedSets,
    activeScreen,
    activeTab,
    finalWorkoutSeconds,
    isPaused: paused,
    pausedAt: paused ? Date.now() : null,
    amrapCircuitsCompleted: circuits,
    amrapSecondsRemaining: amrapRemaining,
    amrapPartialEntries: partialEntries,
  };
}

function openAmrapPartialEntry() {
  const day = data?.routines?.[selectedRoutine]?.days?.[selectedDay];
  setAmrapPartialEntries(
    (day?.exercises || []).map((exercise, index) => {
      const existing = amrapPartialEntries?.[index];
      return {
        name: exercise.name,
        loggingMode: exercise.loggingMode || null,
        plannedWeight:
          exercise.sets?.[0]?.plannedWeight ??
          exercise.sets?.[0]?.weight ??
          "",
        targetReps:
          exercise.sets?.[0]?.targetReps ?? exercise.sets?.[0]?.reps ?? "",
        actualWeight: existing?.actualWeight ?? "",
        actualReps: existing?.actualReps ?? "",
      };
    })
  );
  setActiveWorkoutScreen("amrap-partial");
}

function completeAmrapCircuit() {
  setAmrapCircuitsCompleted((prev) => prev + 1);
}

function undoAmrapCircuit() {
  setAmrapCircuitsCompleted((prev) => Math.max(0, prev - 1));
}

function updateAmrapPartialEntry(index, field, value) {
  setAmrapPartialEntries((prev) =>
    prev.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    )
  );
}

function buildAmrapWorkoutRecord(durationSeconds, partialEntries) {
  const day = currentDay;
  const partial = (partialEntries || [])
    .map((entry) => ({
      name: entry.name,
      plannedWeight: entry.plannedWeight || "",
      targetReps: entry.targetReps || "",
      actualWeight: entry.actualWeight || "",
      actualReps: entry.actualReps || "",
    }))
    .filter(
      (entry) =>
        (entry.actualReps && entry.actualReps !== "" && entry.actualReps !== "0") ||
        (entry.actualWeight && entry.actualWeight !== "")
    );

  const routine = data?.routines?.[selectedRoutine];

  return {
    id: crypto.randomUUID(),
    saveKey: getLocalSaveKey(),
    date: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    week: selectedRoutine,
    routineName:
      String(routine?.name || "").trim() ||
      `Routine ${Number(selectedRoutine) + 1}`,
    day: day?.name || "",
    workoutType: day?.name || "",
    type: "amrap",
    duration: formatTime(durationSeconds),
    durationSeconds: Math.max(0, durationSeconds),
    durationMinutes: getAmrapDurationMinutes(day),
    circuitsCompleted: amrapCircuitsCompleted,
    partialCircuit: partial,
    circuit:
      (day?.exercises || []).length > 0
        ? (day.exercises || []).map((exercise) => ({
            name: exercise.name,
            plannedWeight:
              exercise.sets?.[0]?.plannedWeight ??
              exercise.sets?.[0]?.weight ??
              "",
            targetReps:
              exercise.sets?.[0]?.targetReps ??
              exercise.sets?.[0]?.reps ??
              "",
          }))
        : (amrapPartialEntries || []).map((entry) => ({
            name: entry.name,
            plannedWeight: entry.plannedWeight || "",
            targetReps: entry.targetReps || "",
          })),
    exercises: [],
  };
}

async function endAndSaveAmrapWorkout({
  includePartial = false,
  partialEntries = amrapPartialEntries,
} = {}) {
  setEndWorkoutBusy(true);
  try {
    const durationSeconds = workoutStartTime
      ? Math.floor((Date.now() - workoutStartTime) / 1000)
      : getAmrapDurationMinutes(currentDay) * 60 - amrapSecondsRemaining;

    const workoutRecord = buildAmrapWorkoutRecord(
      Math.max(0, durationSeconds),
      includePartial ? partialEntries : []
    );

    const nextHistory = [
      workoutRecord,
      ...workoutHistory.filter(
        (item) =>
          !(
            item.saveKey === workoutRecord.saveKey &&
            item.week === workoutRecord.week &&
            item.day === workoutRecord.day
          )
      ),
    ];

    const nextDay =
      selectedDay >= (currentWeek?.days?.length || 0) - 1
        ? 0
        : selectedDay + 1;

    const nextData = clearDayProgress(data, selectedRoutine, nextDay);
    const nextActiveWorkoutState = buildActiveWorkoutState({
      paused: false,
      mode: true,
      screen: "stretch",
      seconds: Math.max(0, durationSeconds),
      circuits: amrapCircuitsCompleted,
      amrapRemaining: 0,
      partialEntries: includePartial ? partialEntries : [],
    });

    await persistWorkoutCloudPayload({
      nextData,
      nextHistory,
      nextSelectedDay: nextDay,
      nextActiveWorkoutState,
    });

    setData(nextData);
    setWorkoutHistory(nextHistory);
    setSelectedDay(nextDay);
    setCompletedWorkoutName(
      formatHistorySessionTitle(workoutRecord, nextData?.routines)
    );
    setCompletedWorkout(workoutRecord);
    setCompletedStretch(null);
    setFinalWorkoutSeconds(Math.max(0, durationSeconds));
    setWorkoutStartTime(null);
    setIsPausedWorkout(false);
    setRestPaused(false);
    setStretchOnlyMode(false);
    setStretchRoutineName("");
    setStretchSeconds(0);
    setStretchStartTime(Date.now());
    setWorkoutMode(true);
    setActiveWorkoutScreen("stretch");
    setAmrapSecondsRemaining(0);
    setShowEndWorkoutConfirm(false);
    playFootballWhistle();
  } catch (err) {
    console.error("End and save AMRAP failed", err);
    alert("Could not save AMRAP workout to the cloud. Please try again.");
  } finally {
    setEndWorkoutBusy(false);
  }
}

async function persistWorkoutCloudPayload({
  nextData = data,
  nextHistory = workoutHistory,
  nextSelectedRoutine = selectedRoutine,
  nextSelectedDay = selectedDay,
  nextActiveWorkoutState,
}) {
  const payload = {
    workoutPlans: nextData,
    workoutHistory: nextHistory,
    activeWorkoutState: nextActiveWorkoutState,
    selectedRoutine: nextSelectedRoutine,
    selectedDay: nextSelectedDay,
    exportDate: new Date().toISOString(),
    version: 1,
  };

  const { error } = await supabase
    .from("workout_data")
    .update({ data: payload })
    .eq("user_id", "default-user");

  if (error) throw error;
  return payload;
}

function commitCurrentSetActuals(sourceData) {
  const updated = JSON.parse(JSON.stringify(sourceData));
  const set =
    updated?.routines?.[selectedRoutine]?.days?.[selectedDay]?.exercises?.[
      activeExerciseIndex
    ]?.sets?.[activeSetIndex];

  if (!set) return updated;

  if (set.actualReps === undefined || set.actualReps === "") {
    set.actualReps = set.targetReps ?? set.reps ?? "";
  }

  if (set.actualWeight === undefined || set.actualWeight === "") {
    set.actualWeight = set.plannedWeight ?? set.weight ?? "";
  }

  return updated;
}

function clearDayProgress(sourceData, routineKey, dayIndex) {
  const updated = JSON.parse(JSON.stringify(sourceData));
  const day = updated?.routines?.[routineKey]?.days?.[dayIndex];
  if (!day?.exercises) return updated;

  day.exercises.forEach((exercise) => {
    exercise.remarks = "";
    (exercise.sets || []).forEach((set) => {
      set.actualWeight = undefined;
      set.actualReps = undefined;
    });
  });

  return updated;
}

function buildWorkoutRecordFromData(sourceData, durationSeconds) {
  const day = sourceData?.routines?.[selectedRoutine]?.days?.[selectedDay];
  const routine = sourceData?.routines?.[selectedRoutine];

  return {
    id: crypto.randomUUID(),
    saveKey: getLocalSaveKey(),
    date: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    week: selectedRoutine,
    routineName:
      String(routine?.name || "").trim() ||
      `Routine ${Number(selectedRoutine) + 1}`,
    day: day?.name || currentDay?.name || "",
    workoutType: day?.name || currentDay?.name || "",
    type: "workout",
    duration: formatTime(durationSeconds),
    durationSeconds: Math.max(0, durationSeconds),
    exercises: (day?.exercises || [])
      .map((exercise) => ({
        name: exercise.name,
        remarks: exercise.remarks || "",
        sets: (exercise.sets || [])
          .filter(
            (set) =>
              (set.actualWeight && set.actualWeight !== "") ||
              (set.actualReps && set.actualReps !== "")
          )
          .map((set) => ({
            type: set.type,
            plannedWeight: set.plannedWeight,
            targetReps: set.targetReps,
            actualWeight: set.actualWeight || "",
            actualReps: set.actualReps || "",
          })),
      }))
      .filter((exercise) => exercise.sets.length > 0),
  };
}

async function pauseAndExitWorkout() {
  setEndWorkoutBusy(true);
  try {
    const nextActiveWorkoutState = buildActiveWorkoutState({
      paused: true,
      mode: false,
      restIsPaused: true,
    });

    await persistWorkoutCloudPayload({
      nextActiveWorkoutState,
    });

    setIsPausedWorkout(true);
    setRestPaused(true);
    setWorkoutMode(false);
    setShowEndWorkoutConfirm(false);
  } catch (err) {
    console.error("Pause workout failed", err);
    alert("Could not save paused workout to the cloud. Please try again.");
  } finally {
    setEndWorkoutBusy(false);
  }
}

async function endAndSaveWorkout() {
  if (isAmrapDay(currentDay) || activeWorkoutScreen?.startsWith("amrap")) {
    await endAndSaveAmrapWorkout({
      includePartial: activeWorkoutScreen === "amrap-partial",
      partialEntries: amrapPartialEntries,
    });
    return;
  }

  setEndWorkoutBusy(true);
  try {
    const durationSeconds = workoutStartTime
      ? Math.floor((Date.now() - workoutStartTime) / 1000)
      : workoutSeconds;

    const dataWithCurrentSet = commitCurrentSetActuals(data);
    const workoutRecord = buildWorkoutRecordFromData(
      dataWithCurrentSet,
      durationSeconds
    );

    const nextHistory = [
      workoutRecord,
      ...workoutHistory.filter(
        (item) =>
          !(
            item.saveKey === workoutRecord.saveKey &&
            item.week === workoutRecord.week &&
            item.day === workoutRecord.day
          )
      ),
    ];

    const nextDay =
      selectedDay >= (currentWeek?.days?.length || 0) - 1
        ? 0
        : selectedDay + 1;

    const nextData = clearDayProgress(
      dataWithCurrentSet,
      selectedRoutine,
      nextDay
    );

    const nextActiveWorkoutState = buildActiveWorkoutState({
      paused: false,
      mode: true,
      screen: "stretch",
      seconds: durationSeconds,
      restIsPaused: false,
    });

    await persistWorkoutCloudPayload({
      nextData,
      nextHistory,
      nextSelectedDay: nextDay,
      nextActiveWorkoutState,
    });

    setData(nextData);
    setWorkoutHistory(nextHistory);
    setSelectedDay(nextDay);
    setCompletedWorkoutName(
      formatHistorySessionTitle(workoutRecord, nextData?.routines)
    );
    setCompletedWorkout(workoutRecord);
    setCompletedStretch(null);
    setFinalWorkoutSeconds(durationSeconds);
    setWorkoutStartTime(null);
    setIsPausedWorkout(false);
    setRestPaused(false);
    setStretchOnlyMode(false);
    setStretchRoutineName("");
    setStretchSeconds(0);
    setStretchStartTime(Date.now());
    setWorkoutMode(true);
    setActiveWorkoutScreen("stretch");
    setExpandedExerciseIndex(null);
    setShowEndWorkoutConfirm(false);
    playFootballWhistle();
  } catch (err) {
    console.error("End and save workout failed", err);
    alert("Could not save workout progress to the cloud. Please try again.");
  } finally {
    setEndWorkoutBusy(false);
  }
}

function getTodaySaveKey() {
  return getLocalSaveKey();
}

function beginStretchSession({ only = false } = {}) {
  setStretchOnlyMode(Boolean(only));
  setStretchRoutineName("");
  setStretchSeconds(0);
  setStretchStartTime(Date.now());
  setCompletedStretch(null);
  setWorkoutMode(true);
  setActiveWorkoutScreen("stretch");
  setActiveTab("workout");
  setActiveScreen("app");
}

function startStretchOnly() {
  beginStretchSession({ only: true });
}

async function finishStretchSession() {
  setEndWorkoutBusy(true);
  try {
    const seconds = stretchStartTime
      ? Math.floor((Date.now() - stretchStartTime) / 1000)
      : stretchSeconds;
    const safeSeconds = Math.max(0, seconds);
    const name = stretchRoutineName.trim() || "Stretch / Mobility";
    const stretchEntry = createStretchEntry(getTodaySaveKey(), {
      name,
      duration: formatDurationSeconds(safeSeconds),
      durationSeconds: safeSeconds,
    });

    const nextNames = rememberStretchRoutineName(name, stretchRoutineNames);
    const nextHistory = upsertDayStretch(workoutHistory, stretchEntry);
    const nextActiveWorkoutState = buildActiveWorkoutState({
      paused: false,
      mode: stretchOnlyMode ? false : true,
      screen: stretchOnlyMode ? null : "summary",
      seconds: finalWorkoutSeconds,
      restIsPaused: false,
    });

    await persistWorkoutCloudPayload({
      nextHistory,
      nextActiveWorkoutState,
    });

    setStretchRoutineNames(nextNames);
    setWorkoutHistory(nextHistory);
    setCompletedStretch(stretchEntry);
    setStretchSeconds(safeSeconds);
    setStretchStartTime(null);
    setStretchRoutineName("");

    if (stretchOnlyMode) {
      setStretchOnlyMode(false);
      setWorkoutMode(false);
      setActiveWorkoutScreen(null);
      setActiveScreen("landing");
    } else {
      setWorkoutMode(true);
      setActiveWorkoutScreen("summary");
    }
  } catch (err) {
    console.error("Finish stretch failed", err);
    alert("Could not save stretch to the cloud. Please try again.");
  } finally {
    setEndWorkoutBusy(false);
  }
}

async function skipStretchSession() {
  setEndWorkoutBusy(true);
  try {
    setCompletedStretch(null);
    setStretchSeconds(0);
    setStretchStartTime(null);
    setStretchRoutineName("");

    if (stretchOnlyMode) {
      const nextActiveWorkoutState = buildActiveWorkoutState({
        paused: false,
        mode: false,
        screen: null,
      });
      await persistWorkoutCloudPayload({ nextActiveWorkoutState });
      setStretchOnlyMode(false);
      setWorkoutMode(false);
      setActiveWorkoutScreen(null);
      setActiveScreen("landing");
      return;
    }

    const nextActiveWorkoutState = buildActiveWorkoutState({
      paused: false,
      mode: true,
      screen: "summary",
      seconds: finalWorkoutSeconds,
    });
    await persistWorkoutCloudPayload({ nextActiveWorkoutState });
    setWorkoutMode(true);
    setActiveWorkoutScreen("summary");
  } catch (err) {
    console.error("Skip stretch failed", err);
    alert("Could not continue. Please try again.");
  } finally {
    setEndWorkoutBusy(false);
  }
}

async function endAndDiscardWorkout() {
  setEndWorkoutBusy(true);
  try {
    const nextData = clearDayProgress(data, selectedRoutine, selectedDay);
    const nextActiveWorkoutState = buildActiveWorkoutState({
      paused: false,
      mode: false,
      screen: null,
      seconds: 0,
      rest: 60,
      restIsPaused: false,
    });

    await persistWorkoutCloudPayload({
      nextData,
      nextActiveWorkoutState,
    });

    setData(nextData);
    setIsPausedWorkout(false);
    setRestPaused(false);
    setWorkoutMode(false);
    setActiveWorkoutScreen(null);
    setActiveExerciseIndex(0);
    setActiveSetIndex(0);
    setWorkoutSeconds(0);
    setRestSeconds(60);
    setSkippedSets(0);
    setWorkoutStartTime(null);
    setCompletedWorkout(null);
    setCompletedWorkoutName("");
    setFinalWorkoutSeconds(0);
    setAmrapCircuitsCompleted(0);
    setAmrapSecondsRemaining(0);
    setAmrapPartialEntries([]);
    setExpandedExerciseIndex(null);
    setShowEndWorkoutConfirm(false);
    playFootballWhistle();
  } catch (err) {
    console.error("Discard workout failed", err);
    alert("Could not discard workout in the cloud. Please try again.");
  } finally {
    setEndWorkoutBusy(false);
  }
}

function handleFinishWorkout() {
  if (isAmrapDay(currentDay)) {
    void endAndSaveAmrapWorkout({
      includePartial: activeWorkoutScreen === "amrap-partial",
      partialEntries: amrapPartialEntries,
    });
    return;
  }
  void endAndSaveWorkout();
}

function finishAmrapWithPartial() {
  void endAndSaveAmrapWorkout({
    includePartial: true,
    partialEntries: amrapPartialEntries,
  });
}

function finishAmrapWithoutPartial() {
  void endAndSaveAmrapWorkout({
    includePartial: false,
    partialEntries: [],
  });
}
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
function advanceWorkout() {
if (activeSet) {
  const updated = { ...data };
  const routines = { ...updated.routines };

const week = routines?.[selectedRoutine];

if (!week) return;

const day = week.days?.[selectedDay];

if (!day) return;

const exercise = day.exercises?.[activeExerciseIndex];

if (!exercise) return;

const set = exercise.sets?.[activeSetIndex];

if (!set) return;

  if (set) {
    if (
      set.actualReps === undefined ||
      set.actualReps === ""
    ) {
      set.actualReps = set.targetReps;
    }

    if (
      set.actualWeight === undefined ||
      set.actualWeight === ""
    ) {
      set.actualWeight = set.plannedWeight;
    }
  }

  updated.routines = routines;
  setData(updated);
}
  const isFinalSet = isFinalSetOfWorkout;
  const isLastSet = isLastSetOfExercise;

  if (isFinalSet) {
    handleFinishWorkout();
    return;
  }

  if (isLastSet) {
    setRestSeconds(60);
    setRestPaused(false);
    setActiveWorkoutScreen("rest-exercise");
    return;
  }

  setRestSeconds(60);
  setRestPaused(false);
  setActiveWorkoutScreen("rest-set");
}
function skipExercise() {
  const remainingSets = Math.max(
    0,
    (activeExercise?.sets?.length || 0) - activeSetIndex
  );
  if (remainingSets > 0) {
    setSkippedSets((prev) => prev + remainingSets);
  }

  if (isLastExercise) {
    handleFinishWorkout();
    return;
  }

  setRestSeconds(60);
  setRestPaused(false);
  setActiveWorkoutScreen("rest-exercise");
}

function moveToNextWorkoutStep() {
  if (activeWorkoutScreen === "rest-exercise") {
    setActiveExerciseIndex((prev) =>
      Math.min(prev + 1, Math.max(0, (currentDay?.exercises?.length || 1) - 1))
    );
    setActiveSetIndex(0);
    setRestPaused(false);
    setActiveWorkoutScreen("active");
    return;
  }

  if (activeWorkoutScreen === "rest-set") {
    setActiveSetIndex((prev) => {
      const maxIndex = Math.max(0, (activeExercise?.sets?.length || 1) - 1);
      return Math.min(prev + 1, maxIndex);
    });
    setRestPaused(false);
    setActiveWorkoutScreen("active");
    return;
  }

  if (isLastSetOfExercise) {
    setRestSeconds(60);
    setRestPaused(false);
    setActiveWorkoutScreen("rest-exercise");
  } else {
    setRestSeconds(60);
    setRestPaused(false);
    setActiveWorkoutScreen("rest-set");
  }
}

if (activeScreen === "landing") {
  return (
<LandingPage
  setActiveTab={setActiveTab}
  setActiveScreen={setActiveScreen}
  setSettingsSource={setSettingsSource}
  startStretchOnly={startStretchOnly}
/>
  );
}
if (!isDataLoaded) 
  {return (
  <div className="min-h-screen flex items-center justify-center text-white">
    Loading...
  </div>
);
  }
  console.log("APP WORKOUT HISTORY:", workoutHistory);
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden text-white app-safe">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-black"
        style={{
          backgroundImage: `url(${appBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
<div
  className={`
    relative z-10
    flex min-h-0 flex-1 flex-col
    transition-all duration-250 ease-out
    ${isTransitioning
      ? transitionDirection === "forward"
        ? "opacity-0 translate-x-[-80px]"
        : "opacity-0 translate-x-[80px]"
      : "opacity-100 translate-x-0"
    }
  `}
>
  <div className="mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,0.5rem)] pt-1 sm:px-4">

{activeTab === "history" ? (
<HistoryPage
    workoutHistory={workoutHistory}
    expandedHistoryIndex={expandedHistoryIndex}
    setExpandedHistoryIndex={setExpandedHistoryIndex}
    setWorkoutHistory={setWorkoutHistory}
    setActiveScreen={setActiveScreen}
    setActiveTab={setActiveTab}
    navigateWithTransition={navigateWithTransition}
    routines={data.routines}
  />
) : activeTab === "analytics" ? (
  <AnalyticsPage
    workoutHistory={workoutHistory}
    setActiveScreen={setActiveScreen}
    setActiveTab={setActiveTab}
  />
) : activeTab === "settings" ? (
  <SettingsPage
    data={data}
    setData={setData} 
    workoutHistory={workoutHistory}
    selectedRoutine={selectedRoutine}
    selectedDay={selectedDay}
    setActiveScreen={setActiveScreen}
    setActiveTab={setActiveTab}
    settingsSource={settingsSource}
    setSettingsSource={setSettingsSource}
    navigateWithTransition={navigateWithTransition}
  />
) : activeTab === "workout" && !workoutMode ? (
<WorkoutPreviewPage
  data={data}
  selectedRoutine={selectedRoutine}
  setSelectedRoutine={setSelectedRoutine}
  selectedDay={selectedDay}
  setSelectedDay={setSelectedDay}
  startWorkout={startWorkout}
  setActiveTab={setActiveTab}
  setSettingsSource={setSettingsSource}
  setActiveScreen={setActiveScreen}
  navigateWithTransition={navigateWithTransition}
  setActiveExerciseIndex={setActiveExerciseIndex}
  setActiveSetIndex={setActiveSetIndex}
  setWorkoutSeconds={setWorkoutSeconds}
  setRestSeconds={setRestSeconds}
  setRestPaused={setRestPaused}
  setWorkoutMode={setWorkoutMode}
  setActiveWorkoutScreen={setActiveWorkoutScreen}
  isPausedWorkout={isPausedWorkout}
  setIsPausedWorkout={setIsPausedWorkout}
/>
) : (
  <WorkoutPage {...{
    startWorkout,
    advanceWorkout,
    workoutMode,
    isPausedWorkout,
    setIsPausedWorkout,
    activeWorkoutScreen,
    activeTab,
    setActiveTab,
    workoutHistory,
    showLastWorkout,
    setShowLastWorkout,
    displayedNextWorkout,
    currentDay,
    activeExerciseIndex,
    activeSetIndex,
    activeExercise,
    activeSet,
    hasWeightField,
    updateSet,
    setActiveSetIndex,
    setActiveExerciseIndex,
    setWorkoutMode,
    setShowEndWorkoutConfirm,
    isFinalSetOfWorkout,
    isLastSetOfExercise,
    skipExercise,
    setRestSeconds,
    setRestPaused,
    setSkippedSets,
    formatTime,
    workoutSeconds,
    restSeconds,
    restPaused,
    moveToNextWorkoutStep,
    activeWeekKey,
    activeDayIndex,
    updateExerciseRemark,
    completedWorkoutName,
    finalWorkoutSeconds,
    completedWorkout,
    completedStretch,
    stretchSeconds,
    stretchRoutineName,
    setStretchRoutineName,
    stretchRoutineNames,
    stretchOnlyMode,
    finishStretchSession,
    skipStretchSession,
    setActiveScreen,
    setExpandedExerciseIndex,
    expandedExerciseIndex,
    data,
    setData,
    handleAddSet,
    handleRemoveExercise,
    moveSet,
    handleRemoveSet,
    handleAddExercise,
    setWorkoutStartTime,
    setWorkoutSeconds,
    setActiveWorkoutScreen,
    workoutStartTime,
    showEndWorkoutConfirm,
    handleFinishWorkout,
    pauseAndExitWorkout,
    endAndSaveWorkout,
    endAndDiscardWorkout,
    endWorkoutBusy,
    setWorkoutHistory,
    expandedHistoryIndex,
    setExpandedHistoryIndex,
    amrapCircuitsCompleted,
    amrapSecondsRemaining,
    amrapPartialEntries,
    completeAmrapCircuit,
    undoAmrapCircuit,
    updateAmrapPartialEntry,
    openAmrapPartialEntry,
    finishAmrapWithPartial,
    finishAmrapWithoutPartial,
  }} />
)}
    </div>
  </div>
</div>
);}

export default App;