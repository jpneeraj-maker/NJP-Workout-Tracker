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
  weeks: {
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

const [data, setData] = useState(() => {
  const stored = localStorage.getItem("workout-app-data");

 if (stored) {
  const parsed = JSON.parse(stored);

  if (parsed?.weeks && Object.keys(parsed.weeks).length > 0) {
    return parsed;
  }
}

  return defaultProgram;
});

const [selectedWeek, setSelectedWeek] = useState(() => {
  const saved = localStorage.getItem("selected-week");
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

const [workoutSeconds, setWorkoutSeconds] = useState(
  savedWorkoutState.workoutSeconds ?? 0
);
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
  localStorage.setItem("selected-week", selectedWeek);
}, [selectedWeek]);
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
  !workoutStartTime ||
  activeWorkoutScreen === "summary"
) {
  return;
}

  const interval = setInterval(() => {
    setWorkoutSeconds(
      Math.floor((Date.now() - workoutStartTime) / 1000)
    );
  }, 1000);

  return () => clearInterval(interval);
}, [workoutMode, workoutStartTime, activeWorkoutScreen]);
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
      // 🔔 play immediately
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
}, [
  activeWorkoutScreen,
  restPaused
]);


const currentWeek = data?.weeks?.[selectedWeek] || null;

const hasData = currentWeek && currentWeek.days;

const currentDay =
  currentWeek?.days?.[selectedDay] || null;

const nextWorkoutIndex =
  selectedDay >= (currentWeek?.days?.length || 0)
    ? 0
    : selectedDay;

const displayedNextWorkout =
  (currentWeek?.days?.[nextWorkoutIndex]) || null;

const activeWeekKey = selectedWeek;
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
    const updated = { ...data };
    updated.weeks[activeWeekKey].days[activeDayIndex].exercises[exerciseIndex].sets[
      setIndex
    ][field] = value;

    setData(updated);
  }

function handleAddWeek() {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    const weekKeys = Object.keys(updated.weeks);
    const lastWeekKey = weekKeys[weekKeys.length - 1];

    const lastWeek = updated.weeks[lastWeekKey];
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

    updated.weeks[nextWeekNumber] = newWeek;

    return updated;
  });

  setSelectedWeek(String(Number(selectedWeek) + 1));
  setSelectedDay(0);
}
function updateExerciseRemark(weekKey, dayIndex, exerciseIndex, value) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    updated.weeks[weekKey].days[dayIndex].exercises[exerciseIndex].remarks = value;

    return updated;
  });
}
function handleAddExercise() {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    updated.weeks[activeWeekKey].days[activeDayIndex].exercises.push({
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

    updated.weeks[activeWeekKey].days[activeDayIndex].exercises.splice(
      exerciseIndex,
      1
    );

    return updated;
  });
}
function handleRemoveSet(exerciseIndex, setIndex) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    updated.weeks[activeWeekKey].days[activeDayIndex].exercises[
      exerciseIndex
    ].sets.splice(setIndex, 1);

    return updated;
  });
}
function handleAddSet(exerciseIndex) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    const sets =
      updated.weeks[activeWeekKey].days[activeDayIndex].exercises[exerciseIndex]
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
      updated.weeks[activeWeekKey].days[activeDayIndex].exercises[exerciseIndex]
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
    week: selectedWeek,
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

  updated.weeks[selectedWeek]?.days?.[nextDay]?.exercises || [].forEach((exercise) => {
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
  const weeks = { ...updated.weeks };

  const week = weeks[selectedWeek];
  const day = week?.days?.[selectedDay];
  const exercise = day?.exercises?.[activeExerciseIndex];
  const set = exercise?.sets?.[activeSetIndex];

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

  updated.weeks = weeks;
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

  return (
    <div
  className="min-h-screen text-white"
  style={{
    backgroundImage: `url(${appBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  }}
>
  <div className="min-h-screen bg-black/55 backdrop-blur-sm p-4 max-w-md mx-auto">
{!hasData ? (
  <div className="text-white p-4">
    No workout data. Go to Settings to create a routine.
  </div>
) : activeTab === "history" ? (
  <HistoryPage
    workoutHistory={workoutHistory}
    expandedHistoryIndex={expandedHistoryIndex}
    setExpandedHistoryIndex={setExpandedHistoryIndex}
    setWorkoutHistory={setWorkoutHistory}
    setActiveScreen={setActiveScreen}
  />
) : activeTab === "settings" ? (
  <SettingsPage
    data={data}
    workoutHistory={workoutHistory}
    selectedWeek={selectedWeek}
    selectedDay={selectedDay}
    setActiveScreen={setActiveScreen}
    setActiveTab={setActiveTab}
    settingsSource={settingsSource}
    setSettingsSource={setSettingsSource}
  />
) : activeTab === "workout" && !workoutMode ? (
<WorkoutPreviewPage {...{
  displayedNextWorkout,
  setActiveTab,
  setSettingsSource,
  setActiveScreen,
  startWorkout
}} />
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
);}

export default App;