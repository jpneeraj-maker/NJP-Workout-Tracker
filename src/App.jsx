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
import { workoutData } from "./workoutData.js";

import appBackground from "./app-background.png";
import bellSound from "./Assets/sounds/rest-complete/timer-end-bell.mp3";

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

const bellRef = useRef(null);

if (!bellRef.current) {
  bellRef.current = new Audio(bellSound);
}

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
  Array.isArray(data.routines) &&
  data.routines.length > 0;

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
    restPaused ||
    activeWorkoutScreen === "summary"
  ) {
    return;
  }

  const interval = setInterval(() => {
    setWorkoutSeconds(prev => prev + 1);
  }, 1000);

  return () => clearInterval(interval);
}, [workoutMode, restPaused, activeWorkoutScreen]);

useEffect(() => {
  if (
    activeWorkoutScreen !== "rest-set" &&
    activeWorkoutScreen !== "rest-exercise"
  ) {
    return;
  }

  const interval = setInterval(() => {
    setRestSeconds((prev) => {
      if (prev <= 1) {
        if (!restPaused) {
          bellRef.current.currentTime = 0;
          bellRef.current.play().catch(() => {});
        }

        setRestPaused(true);
        moveToNextWorkoutStep();

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
    
  if (bellRef.current) {
    bellRef.current.volume = 1;

    bellRef.current.play()
      .then(() => {
        bellRef.current.pause();
        bellRef.current.currentTime = 0;
      })
      .catch(() => {});
  }
  
  setWorkoutMode(true);
  setActiveWorkoutScreen("active");

  setActiveExerciseIndex(0);
  setActiveSetIndex(0);

  const now = Date.now();
  setWorkoutStartTime(now);
  setWorkoutSeconds(0);

  setRestSeconds(60);
  setRestPaused(false);

  setSkippedSets(0);

  setCompletedWorkout(null);
  setCompletedWorkoutName("");
  setFinalWorkoutSeconds(0);

  setShowEndWorkoutConfirm(false);
}
function handleFinishWorkout() {
const workoutRecord = {
  saveKey: new Date().toISOString().slice(0, 10),

  date: new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
    week: selectedRoutine,
    day: currentDay.name,
exercises: (currentDay?.exercises || [])
  .map((exercise) => ({
    name: exercise.name,
    remarks: exercise.remarks || "",
    sets: exercise.sets
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

setWorkoutHistory((prev) => {
  const filtered = prev.filter(
    (item) =>
      !(
item.saveKey === workoutRecord.saveKey &&
item.week === workoutRecord.week &&
item.day === workoutRecord.day
      )
  );

  return [workoutRecord, ...filtered];
});

const nextDay =
  selectedDay >= (currentWeek?.days?.length || 0) - 1
    ? 0
    : selectedDay + 1;
setCompletedWorkoutName(currentDay.name);
setCompletedWorkout(workoutRecord);
setSelectedDay(nextDay);
setData((prev) => {
  const updated = JSON.parse(JSON.stringify(prev));

  updated.routines[selectedRoutine]?.days?.[nextDay]?.exercises || [].forEach((exercise) => {
    exercise.remarks = "";

    exercise.sets.forEach((set) => {
      set.actualWeight = undefined;
      set.actualReps = undefined;
    });
  });

  return updated;
}); 
setFinalWorkoutSeconds(
  Math.floor((Date.now() - workoutStartTime) / 1000)
);
setWorkoutStartTime(null);
setActiveWorkoutScreen("summary");

setExpandedExerciseIndex(null);
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
function moveToNextWorkoutStep() {
  if (activeWorkoutScreen === "rest-exercise") {
    setActiveExerciseIndex((prev) => prev + 1);
    setActiveSetIndex(0);
    setActiveWorkoutScreen("active");
    return;
  }

  if (activeWorkoutScreen === "rest-set") {
    setActiveSetIndex((prev) => prev + 1);
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
   
    <div
  className="min-h-screen text-white"
  style={{
    backgroundImage: `url(${appBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "scroll",
  }}
>
<div
  className={`
    min-h-screen
    transition-all duration-250 ease-out
    ${isTransitioning
      ? transitionDirection === "forward"
        ? "opacity-0 translate-x-[-80px]"
        : "opacity-0 translate-x-[80px]"
      : "opacity-100 translate-x-0"
    }
  `}
>
  <div className="max-w-md mx-auto px-4">

{activeTab === "history" ? (
<HistoryPage
    workoutHistory={workoutHistory}
    expandedHistoryIndex={expandedHistoryIndex}
    setExpandedHistoryIndex={setExpandedHistoryIndex}
    setWorkoutHistory={setWorkoutHistory}
    setActiveScreen={setActiveScreen}
    navigateWithTransition={navigateWithTransition}
    workoutHistory={workoutHistory}
    setWorkoutHistory={setWorkoutHistory}
    setActiveScreen={setActiveScreen}
    routines={data.routines}
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
/>
) : (
  <WorkoutPage {...{
    startWorkout,
    advanceWorkout,
    workoutMode,
    activeWorkoutScreen,
    activeTab,
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
    setWorkoutHistory,
    expandedHistoryIndex,
    setExpandedHistoryIndex
  }} />
)}
    </div>
  </div>
</div>
);}

export default App;