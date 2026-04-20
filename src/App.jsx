import { useEffect, useState } from "react";
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

import { workoutData } from "./workoutData.js";
import landingBg from "./landing-bg.png";
import appBackground from "./app-background.png";

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

export default function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("workout-app-data");
    return saved ? JSON.parse(saved) : workoutData;
  });

const [selectedWeek, setSelectedWeek] = useState(() => {
  const saved = localStorage.getItem("selected-week");
  return saved ? saved : "7";
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

  if (restPaused) return;

  if (restSeconds <= 0) {
    moveToNextWorkoutStep();
    return;
  }

  const interval = setInterval(() => {
    setRestSeconds((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(interval);
}, [
  activeWorkoutScreen,
  restSeconds,
  restPaused,
]);

const currentWeek = data.weeks[selectedWeek]; 
const currentDay = currentWeek.days[selectedDay];
const nextWorkoutIndex =
  selectedDay >= currentWeek.days.length
    ? 0
    : selectedDay;

const displayedNextWorkout =
  currentWeek.days[nextWorkoutIndex];
const activeWeekKey = selectedWeek;
const activeDayIndex = selectedDay;

const activeExercise =
  currentDay.exercises[activeExerciseIndex];

const activeSet =
  activeExercise?.sets[activeSetIndex];
const isLastSetOfExercise =
  activeExercise &&
  activeSetIndex === activeExercise.sets.length - 1;

const isLastExercise =
  currentDay.exercises &&
  activeExerciseIndex === currentDay.exercises.length - 1;

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
          set.actualWeight = "";
          set.actualReps = "";
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
    actualWeight: "",
    actualReps: "",
  },
  {
    type: "Ramp Up",
    plannedWeight: "",
    targetReps: "",
    actualWeight: "",
    actualReps: "",
  },
  {
    type: "Working Set 1",
    plannedWeight: "",
    targetReps: "",
    actualWeight: "",
    actualReps: "",
  },
  {
    type: "Working Set 2",
    plannedWeight: "",
    targetReps: "",
    actualWeight: "",
    actualReps: "",
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
      actualWeight: "",
      actualReps: "",
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
exercises: currentDay.exercises
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
  selectedDay >= currentWeek.days.length - 1
    ? 0
    : selectedDay + 1;
setCompletedWorkoutName(currentDay.name);
setCompletedWorkout(workoutRecord);
setSelectedDay(nextDay);
setData((prev) => {
  const updated = JSON.parse(JSON.stringify(prev));

  updated.weeks[selectedWeek].days[nextDay].exercises.forEach((exercise) => {
    exercise.remarks = "";

    exercise.sets.forEach((set) => {
      set.actualWeight = "";
      set.actualReps = "";
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
function handleAdvanceWorkout() {
if (isFinalSetOfWorkout) {
  handleFinishWorkout();
  setActiveWorkoutScreen("summary");
  return;
}

  if (isLastSetOfExercise) {
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
    <div className="fixed inset-0 flex items-end justify-center pb-2"
      style={{
        backgroundImage: `url(${landingBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex items-center gap-3 animate-[fadeIn_0.7s_ease_forwards]">
        <button
          onClick={() => {
           window.history.pushState({ screen: "app" }, "");
           setActiveTab("workout");
           setActiveScreen("app");
}}
className="px-6 py-2 min-w-[130px] rounded-lg text-sm font-light tracking-[0.28em] uppercase border border-[#c7a86a55] text-[#d7c7a4] bg-black/35 backdrop-blur-sm active:scale-95 transition-all"        >
          Workout
        </button>

        <button
          onClick={() => {
            window.history.pushState({ screen: "app" }, "");
            setActiveTab("history");
            setActiveScreen("app");
          }}
className="px-6 py-2 min-w-[130px] rounded-lg text-sm font-light tracking-[0.28em] uppercase border border-[#c7a86a55] text-[#d7c7a4] bg-black/35 backdrop-blur-sm active:scale-95 transition-all"        >
          History
        </button>

        <button
          onClick={() => {
            window.history.pushState({ screen: "app" }, "");
            setActiveTab("settings");
            setActiveScreen("app");
          }}
className="w-14 h-10 rounded-lg text-base border border-[#c7a86a55] text-[#d7c7a4] bg-black/35 backdrop-blur-sm active:scale-95 transition-all"
        >
          ⚙
        </button>
      </div>
    </div>
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
  {!workoutMode && activeWorkoutScreen !== "summary" && (
  <>
      <div className="mb-5 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
  <button
    onClick={() => setShowLastWorkout(!showLastWorkout)}
    className="w-full text-left"
  >
    <div className="text-[11px] uppercase tracking-[0.25em] text-[#d7c7a4]/70 mb-1">
      Last Completed Workout
    </div>

{workoutHistory.length > 0 ? (
  <>
    <div className="text-sm text-white/70">
      {workoutHistory[0].date}
    </div>

    <div className="text-lg font-semibold text-[#f5e7c8]">
      {workoutHistory[0].day}
    </div>
  </>
) : (
  <div className="text-white/60 text-sm">
    No completed workout yet
  </div>
)}
  </button>

{showLastWorkout && workoutHistory.length > 0 && (
  <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
    {workoutHistory[0].exercises.map((exercise, exerciseIndex) => (
      <div key={exerciseIndex}>
        <div className="text-sm font-semibold text-[#f5e7c8] mb-1">
          {exercise.name}
        </div>

        <div className="text-sm text-white/75 leading-6">
          {exercise.sets
            .map((set) => {
              const weight =
                set.actualWeight || set.plannedWeight || "-";
              const reps =
                set.actualReps || set.targetReps || "-";

              return `${weight} × ${reps}`;
            })
            .join("   ·   ")}
        </div>
      </div>
    ))}
  </div>
)}
</div>

<div className="mb-5 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
  <div className="text-[11px] uppercase tracking-[0.25em] text-[#d7c7a4]/70 mb-1">
    Next Scheduled Workout
  </div>

<div className="text-lg font-semibold text-[#f5e7c8]">
{displayedNextWorkout?.name}
</div>
</div>
  </>
)}
{activeTab === "workout" && workoutMode && activeWorkoutScreen === "active" && (
  <div className="flex min-h-[calc(100vh-2rem)] flex-col">
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between text-sm text-white/70">
        <button
          onClick={() => setWorkoutMode(false)}
          className="text-xl leading-none text-white/70"
        >
          ←
        </button>

        <div className="text-center">
          <div className="text-lg font-semibold text-white">
            {currentDay.name}
          </div>
        </div>

        <button
          onClick={() => setShowEndWorkoutConfirm(true)}
          className="text-xl leading-none text-white/70"
        >
          ⋯
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-white/60">
        <div>
          Workout Time
        </div>

        <div className="font-mono text-sm text-white">
          {formatTime(workoutSeconds)}
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between text-sm font-medium">
        <div className="text-[#d7c7a4]">
          Exercise {activeExerciseIndex + 1} of {currentDay.exercises.length}
        </div>

        <div className="text-white/80">
          Set {activeSetIndex + 1} of {activeExercise.sets.length}
        </div>
      </div>

      <div className="mb-4 h-[170px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.3em] text-white/30">
          Media Placeholder
        </div>
      </div>

      <div className="mb-1 text-2xl font-semibold text-white">
        {activeExercise.name}
      </div>

      <div className="mb-4 text-sm font-medium text-[#4da3ff]">
        {activeSet.type}
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-white/50">
          Planned
        </div>

        <div className="text-base text-white">
          {activeSet.plannedWeight || "-"} kg × {activeSet.targetReps || "-"} reps
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/50">
          Actual
        </div>
{hasWeightField ? (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <input
        type="text"
        inputMode="decimal"
        value={activeSet.actualWeight || activeSet.plannedWeight || ""}
        onChange={(e) =>
          updateSet(
            activeExerciseIndex,
            activeSetIndex,
            "actualWeight",
            e.target.value
          )
        }
        className="mb-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-white"
      />

      <div className="text-center text-xs text-white/50">
        kg
      </div>
    </div>

    <div>
      <input
        type="text"
        inputMode="decimal"
        value={activeSet.actualReps || ""}
        onChange={(e) =>
          updateSet(
            activeExerciseIndex,
            activeSetIndex,
            "actualReps",
            e.target.value
          )
        }
        className="mb-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-white"
      />

      <div className="text-center text-xs text-white/50">
        reps
      </div>
    </div>
  </div>
) : (
  <div>
    <input
      type="text"
      inputMode="decimal"
      value={activeSet.actualReps || ""}
      onChange={(e) =>
        updateSet(
          activeExerciseIndex,
          activeSetIndex,
          "actualReps",
          e.target.value
        )
      }
      className="mb-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-white"
    />

    <div className="text-center text-xs text-white/50">
      reps
    </div>
  </div>
)}
</div>
      <div className="grid grid-cols-3 gap-2">
<button
  onClick={() => {
    if (activeSetIndex > 0) {
      setActiveSetIndex((prev) => prev - 1);
    } else if (activeExerciseIndex > 0) {
      const previousExercise =
        currentDay.exercises[activeExerciseIndex - 1];

      setActiveExerciseIndex((prev) => prev - 1);
      setActiveSetIndex(previousExercise.sets.length - 1);
    }
  }}
  className="rounded-xl border border-white/10 bg-black/20 py-3 text-sm text-white/80"
>
  Previous
</button>

<button
  onClick={() => {
    setSkippedSets((prev) => prev + 1);

    if (isFinalSetOfWorkout) {
      setActiveWorkoutScreen("summary");
      return;
    }

    if (isLastSetOfExercise) {
      setRestSeconds(60);
      setRestPaused(false);
      setActiveWorkoutScreen("rest-exercise");
      return;
    }

    setRestSeconds(60);
    setRestPaused(false);
    setActiveWorkoutScreen("rest-set");
  }}
  className="rounded-xl border border-[#d88d2f]/40 bg-[#d88d2f]/10 py-3 text-sm font-medium text-[#f2b25c]"
>
  Skip Set
</button>

        <button
          onClick={handleAdvanceWorkout}
          className={`rounded-xl py-3 text-sm font-medium ${
            isFinalSetOfWorkout
              ? "bg-green-600/20 border border-green-500/40 text-green-300"
              : isLastSetOfExercise
              ? "bg-green-600/20 border border-green-500/40 text-green-300"
              : "bg-blue-600/20 border border-blue-500/40 text-blue-300"
          }`}
        >
          {isFinalSetOfWorkout
            ? "Finish Workout"
            : isLastSetOfExercise
            ? "Next Exercise"
            : "Rest 1:00"}
        </button>
      </div>
    </div>

    <button
      onClick={() => setShowEndWorkoutConfirm(true)}
      className="mt-4 rounded-2xl border border-red-500/30 bg-red-600/20 py-3 text-sm font-medium text-red-300"
    >
      End Workout
    </button>
  </div>
)}
{activeTab === "workout" &&
  workoutMode &&
  activeWorkoutScreen === "rest-set" && (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between text-sm text-white/70">
          <button
            onClick={() => setWorkoutMode(false)}
            className="text-xl leading-none text-white/70"
          >
            ←
          </button>

          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              Rest Between Sets
            </div>
          </div>

          <button
            onClick={() => setShowEndWorkoutConfirm(true)}
            className="text-xl leading-none text-white/70"
          >
            ⋯
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-white/60">
          <div>Workout Time</div>

          <div className="font-mono text-sm text-white">
            {formatTime(workoutSeconds)}
          </div>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="flex h-48 w-48 items-center justify-center rounded-full border-4 border-blue-500/50 bg-black/20">
            <div className="text-center">
              <div className="font-mono text-5xl text-white">
                {formatTime(restSeconds)}
              </div>

              <div className="mt-2 text-[11px] uppercase tracking-[0.25em] text-white/50">
                Time Remaining
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
          <div className="mb-2 text-sm font-medium text-blue-300">
            Next Set
          </div>

          <div className="text-lg font-semibold text-white">
            {activeExercise.name}
          </div>

          <div className="mt-1 text-sm text-white/70">
            {activeExercise.sets[activeSetIndex + 1]?.type}
          </div>

          <div className="mt-3 text-sm text-white/60">
            Target
          </div>

          <div className="text-base text-white">
            {activeExercise.sets[activeSetIndex + 1]?.plannedWeight || "-"} kg ×{" "}
            {activeExercise.sets[activeSetIndex + 1]?.targetReps || "-"} reps
          </div>
        </div>
        <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
  <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/50">
    Exercise Remarks
  </div>

  <textarea
    value={activeExercise.remarks || ""}
    onChange={(e) =>
      updateExerciseRemark(
        activeWeekKey,
        activeDayIndex,
        activeExerciseIndex,
        e.target.value
      )
    }
    placeholder="Add notes for this set..."
    rows={3}
    className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/30"
  />
</div>
        <div className="mb-3 grid grid-cols-4 gap-2">
          <button
            onClick={() => setRestSeconds((prev) => Math.max(0, prev - 30))}
            className="rounded-xl border border-white/10 bg-black/20 py-2 text-sm text-white/80"
          >
            -30s
          </button>

          <button
            onClick={() => setRestSeconds((prev) => Math.max(0, prev - 15))}
            className="rounded-xl border border-white/10 bg-black/20 py-2 text-sm text-white/80"
          >
            -15s
          </button>

          <button
            onClick={() => setRestSeconds((prev) => prev + 15)}
            className="rounded-xl border border-white/10 bg-black/20 py-2 text-sm text-white/80"
          >
            +15s
          </button>

          <button
            onClick={() => setRestSeconds((prev) => prev + 30)}
            className="rounded-xl border border-white/10 bg-black/20 py-2 text-sm text-white/80"
          >
            +30s
          </button>
        </div>

        <button
          onClick={() => setRestPaused((prev) => !prev)}
          className="mb-3 w-full rounded-xl border border-white/10 bg-black/20 py-3 text-sm font-medium text-white"
        >
          {restPaused ? "Resume" : "Pause"}
        </button>

        <button
          onClick={moveToNextWorkoutStep}
          className="w-full rounded-xl border border-white/10 bg-black/20 py-3 text-sm font-medium text-white"
        >
          Skip Rest
        </button>
      </div>

      <button
        onClick={() => setShowEndWorkoutConfirm(true)}
        className="mt-4 rounded-2xl border border-red-500/30 bg-red-600/20 py-3 text-sm font-medium text-red-300"
      >
        End Workout
      </button>
    </div>
)}
{activeTab === "workout" &&
  workoutMode &&
  activeWorkoutScreen === "rest-exercise" && (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between text-sm text-white/70">
          <button
            onClick={() => setWorkoutMode(false)}
            className="text-xl leading-none text-white/70"
          >
            ←
          </button>

          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              Next Exercise
            </div>
          </div>

          <button
            onClick={() => setShowEndWorkoutConfirm(true)}
            className="text-xl leading-none text-white/70"
          >
            ⋯
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-white/60">
          <div>Workout Time</div>

          <div className="font-mono text-sm text-white">
            {formatTime(workoutSeconds)}
          </div>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="flex h-48 w-48 items-center justify-center rounded-full border-4 border-green-500/50 bg-black/20">
            <div className="text-center">
              <div className="font-mono text-5xl text-white">
                {formatTime(restSeconds)}
              </div>

              <div className="mt-2 text-[11px] uppercase tracking-[0.25em] text-white/50">
                Time Remaining
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
          <div className="mb-2 text-sm font-medium text-green-300">
            Coming Up
          </div>

          <div className="text-sm text-white/60">
            Exercise {activeExerciseIndex + 2} of {currentDay.exercises.length}
          </div>

          <div className="mt-2 text-xl font-semibold text-white">
            {currentDay.exercises[activeExerciseIndex + 1]?.name}
          </div>

          <div className="mt-2 text-sm text-white/70">
            {currentDay.exercises[activeExerciseIndex + 1]?.sets.length} Sets Planned
          </div>

          <div className="mt-4 text-sm text-white/60">
            First Set Target
          </div>

          <div className="text-base text-white">
            {currentDay.exercises[activeExerciseIndex + 1]?.sets[0]?.plannedWeight || "-"} kg ×{" "}
            {currentDay.exercises[activeExerciseIndex + 1]?.sets[0]?.targetReps || "-"} reps
          </div>
        </div>
<div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
  <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/50">
    Exercise Remarks
  </div>

  <textarea
    value={activeExercise.remarks || ""}
    onChange={(e) =>
      updateExerciseRemark(
        activeWeekKey,
        activeDayIndex,
        activeExerciseIndex,
        e.target.value
      )
    }
    placeholder="Add notes for this exercise..."
    rows={3}
    className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/30"
  />
</div>
        <div className="mb-3 grid grid-cols-4 gap-2">
          <button
            onClick={() => setRestSeconds((prev) => Math.max(0, prev - 30))}
            className="rounded-xl border border-white/10 bg-black/20 py-2 text-sm text-white/80"
          >
            -30s
          </button>

          <button
            onClick={() => setRestSeconds((prev) => Math.max(0, prev - 15))}
            className="rounded-xl border border-white/10 bg-black/20 py-2 text-sm text-white/80"
          >
            -15s
          </button>

          <button
            onClick={() => setRestSeconds((prev) => prev + 15)}
            className="rounded-xl border border-white/10 bg-black/20 py-2 text-sm text-white/80"
          >
            +15s
          </button>

          <button
            onClick={() => setRestSeconds((prev) => prev + 30)}
            className="rounded-xl border border-white/10 bg-black/20 py-2 text-sm text-white/80"
          >
            +30s
          </button>
        </div>

        <button
          onClick={() => setRestPaused((prev) => !prev)}
          className="mb-3 w-full rounded-xl border border-white/10 bg-black/20 py-3 text-sm font-medium text-white"
        >
          {restPaused ? "Resume" : "Pause"}
        </button>

        <button
          onClick={moveToNextWorkoutStep}
          className="w-full rounded-xl border border-white/10 bg-black/20 py-3 text-sm font-medium text-white"
        >
          Skip Rest
        </button>
      </div>

      <button
        onClick={() => setShowEndWorkoutConfirm(true)}
        className="mt-4 rounded-2xl border border-red-500/30 bg-red-600/20 py-3 text-sm font-medium text-red-300"
      >
        End Workout
      </button>
    </div>
)}
{activeTab === "workout" &&
  activeWorkoutScreen === "summary" && (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur-md">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-500/40 bg-green-500/10 text-3xl text-green-300">
            ✓
          </div>
        </div>

        <div className="mb-1 text-2xl font-semibold text-green-300">
          Workout Complete
        </div>

        <div className="mb-1 text-lg text-white">
          {completedWorkoutName}
        </div>

        <div className="mb-6 text-sm text-white/60">
          {formatTime(finalWorkoutSeconds)}
        </div>

<div className="mb-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-2xl font-semibold text-white">
              {completedWorkout?.exercises.length || 0}
            </div>

            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">
              Exercises
            </div>
          </div>
<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
  <div className="text-2xl font-semibold text-white">
    {formatTime(finalWorkoutSeconds)}
  </div>

  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">
    Duration
  </div>
</div>
</div>
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/50">
    Workout Details
  </div>

  <div className="space-y-3">
    {completedWorkout?.exercises?.map((exercise, index) => (
      <div key={index} className="text-sm text-white">
        <span className="font-semibold text-[#f5e7c8]">
          {exercise.name}
        </span>
        {" : "}
        {exercise.sets
          .map((set) => {
            const weight =
              set.actualWeight || set.plannedWeight || "-";

            const reps =
              set.actualReps || set.targetReps || "-";

            return `${weight} x ${reps}`;
          })
          .join(" | ")}
      </div>
    ))}
  </div>
</div>
<div className="grid grid-cols-2 gap-3">
  <button
onClick={() => {
  setWorkoutMode(false);
  setActiveWorkoutScreen(null);
  setActiveTab("history");
}}
    className="rounded-2xl border border-white/10 bg-black/20 py-3 text-sm font-medium text-white"
  >
    View History
  </button>

  <button
onClick={() => {
  setWorkoutMode(false);
  setActiveWorkoutScreen(null);
  setActiveScreen("landing");
}}
    className="rounded-2xl border border-white/10 bg-black/20 py-3 text-sm font-medium text-white"
  >
    Return Home
  </button>
</div>
      </div>
    </div>
)}
{activeTab === "workout" &&
  !workoutMode &&
  activeWorkoutScreen !== "summary" && (
  <>
<DndContext
  collisionDetection={closestCenter}
  onDragEnd={(event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setData((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));

      const exercises =
        updated.weeks[activeWeekKey].days[activeDayIndex].exercises;

      const oldIndex = exercises.findIndex(
        (_, index) => index === active.id
      );

      const newIndex = exercises.findIndex(
        (_, index) => index === over.id
      );

      updated.weeks[activeWeekKey].days[activeDayIndex].exercises =
        arrayMove(exercises, oldIndex, newIndex);

      return updated;
    });
  }}
>
  <SortableContext
    items={currentDay.exercises.map((_, index) => index)}
    strategy={verticalListSortingStrategy}
  >
{currentDay.exercises.map((exercise, exerciseIndex) => (
  <SortableExerciseCard
    key={exerciseIndex}
    id={exerciseIndex}
  >
    {(listeners) => (
      <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
        <button
          onClick={() =>
            setExpandedExerciseIndex(
              expandedExerciseIndex === exerciseIndex
                ? null
                : exerciseIndex
            )
          }
          className="w-full flex items-center justify-between gap-3 text-left min-h-[88px]"
        >
<div className="flex items-center gap-3 flex-1 min-w-0 self-center">
  {!workoutMode && (
    <div
      {...listeners}
      className="text-white/40 text-xl px-1 cursor-grab touch-none"
    >
      ⋮⋮
    </div>
  )}

  {workoutMode ? (
    <h2 className="flex-1 text-2xl font-semibold truncate">
      {exercise.name}
    </h2>
  ) : (
    <input
      value={exercise.name}
      onChange={(e) => {
        const updated = { ...data };
        updated.weeks[activeWeekKey].days[activeDayIndex].exercises[
          exerciseIndex
        ].name = e.target.value;
        setData(updated);
      }}
      className="flex-1 min-w-0 bg-transparent text-lg font-semibold text-[#f5e7c8] border border-white/10 rounded-xl px-3 py-1.5"
    />
  )}
</div>

{!workoutMode && (
  <div className="flex flex-col gap-2 shrink-0 text-sm text-[#d7c7a4]">

    <button
      onClick={() => handleAddSet(exerciseIndex)}
      className="rounded-lg border border-white/10 bg-black/20 px-3 py-1 text-[#d7c7a4]"
    >
      +Set
    </button>

    <button
      onClick={() => {
        if (window.confirm(`Delete ${exercise.name}?`)) {
          handleRemoveExercise(exerciseIndex);
        }
      }}
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300"
    >
      🗑️
    </button>
  </div>
)}
</button>
{expandedExerciseIndex === exerciseIndex && (
  <div className="space-y-3 mt-4">
    {exercise.sets.map((set, setIndex) => (
      <div
        key={setIndex}
        className="rounded-2xl border border-white/10 bg-black/20 p-3"
      >
        <div className="mb-3 flex items-center justify-between">
          <input
            type="text"
            value={set.type}
            onChange={(e) =>
              updateSet(exerciseIndex, setIndex, "type", e.target.value)
            }
            className="w-[120px] rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm font-medium text-[#d7c7a4]"
          />

          <div className="flex items-center gap-2">
            {setIndex > 0 && (
              <button
                onClick={() => moveSet(exerciseIndex, setIndex, -1)}
                className="h-7 w-7 rounded-lg border border-white/10 bg-black/20 text-[#d7c7a4]"
              >
                ↑
              </button>
            )}

            {setIndex < exercise.sets.length - 1 && (
              <button
                onClick={() => moveSet(exerciseIndex, setIndex, 1)}
                className="h-7 w-7 rounded-lg border border-white/10 bg-black/20 text-[#d7c7a4]"
              >
                ↓
              </button>
            )}

            <button
              onClick={() => {
                if (window.confirm(`Delete ${set.type}?`)) {
                  handleRemoveSet(exerciseIndex, setIndex);
                }
              }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-300"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-white/50">
              Planned
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={set.plannedWeight}
                onChange={(e) =>
                  updateSet(
                    exerciseIndex,
                    setIndex,
                    "plannedWeight",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-center text-white"
              />

              <span className="text-white/50">×</span>

              <input
                type="text"
                inputMode="decimal"
                value={set.targetReps}
                onChange={(e) =>
                  updateSet(
                    exerciseIndex,
                    setIndex,
                    "targetReps",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-center text-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-white/50">
              Actual
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={set.actualWeight || ""}
                onChange={(e) =>
                  updateSet(
                    exerciseIndex,
                    setIndex,
                    "actualWeight",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-center text-white"
              />

              <span className="text-white/50">×</span>

              <input
                type="text"
                inputMode="decimal"
                value={set.actualReps || ""}
                onChange={(e) =>
                  updateSet(
                    exerciseIndex,
                    setIndex,
                    "actualReps",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-center text-white"
              />
            </div>
          </div>
        </div>
      </div>
    ))}

    <textarea
      value={exercise.remarks || ""}
      onChange={(e) =>
updateExerciseRemark(
  activeWeekKey,
  activeDayIndex,
  exerciseIndex,
  e.target.value
)
      }
      placeholder="Remarks / notes about this exercise..."
      rows={3}
      className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-white"
    />
  </div>
)}
      </div>
    )}
  </SortableExerciseCard>
))}
  </SortableContext>
</DndContext>
{!workoutMode && (
  <>
    <button
      onClick={handleAddExercise}
      className="w-full mt-4 p-3 rounded-2xl bg-green-600 text-white"
    >
      + Add Exercise
    </button>

    <button
      onClick={() => {
  setWorkoutMode(true);

  setActiveWorkoutScreen("active");

  setActiveExerciseIndex(0);
  setActiveSetIndex(0);

  setRestSeconds(60);
  setRestPaused(false);

  setSkippedSets(0);

  const now = Date.now();
  setWorkoutStartTime(now);
  setWorkoutSeconds(0);
}}
      className="w-full mt-4 p-4 rounded-3xl bg-gradient-to-r from-fuchsia-600 to-purple-500 text-xl font-bold text-white shadow-lg"
    >
      Start Scheduled Workout
    </button>
  </>
)}
  </>
)}
{activeTab === "settings" && !workoutMode && (
  <>

    <div className="flex gap-2 mt-3">
      <button
onClick={() => {
  const exportData = JSON.stringify(data, null, 2);

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(exportData)
      .then(() => {
        alert("Workout data copied to clipboard");
      })
      .catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = exportData;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        alert("Workout data copied to clipboard");
      });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = exportData;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    alert("Workout data copied to clipboard");
  }
}}
        className="flex-1 p-3 rounded-2xl bg-zinc-700 text-white"
      >
        Export
      </button>

      <button
        onClick={() => {
          const pasted = prompt("Paste backup data here");

          if (!pasted) return;

          try {
            const parsed = JSON.parse(pasted);
            setData(parsed);
            alert("Backup imported successfully");
          } catch {
            alert("Invalid backup data");
          }
        }}
        className="flex-1 p-3 rounded-2xl bg-blue-600 text-white"
      >
        Import
      </button>
    </div>
  </>
  )}
{activeTab === "history" && workoutHistory.length > 0 && (
  <div className="mt-6">
    <h2 className="text-xl font-bold mb-3">Workout History</h2>

    {workoutHistory.map((workout, index) => (
      <div
        key={index}
        className="bg-zinc-900 rounded-2xl p-4 mb-3"
      >
        <button
          onClick={() =>
            setExpandedHistoryIndex(
              expandedHistoryIndex === index ? null : index
            )
          }
          className="w-full flex justify-between items-center text-left"
        >
          <div className="font-semibold">
            {workout.date} — {workout.day}
          </div>

<div className="flex items-center gap-3">
  <button
    onClick={(e) => {
      e.stopPropagation();

      if (window.confirm("Delete this workout history entry?")) {
        setWorkoutHistory((prev) =>
          prev.filter((_, historyIndex) => historyIndex !== index)
        );

        if (expandedHistoryIndex === index) {
          setExpandedHistoryIndex(null);
        }
      }
    }}
    className="text-red-500 text-sm"
  >
    🗑️
  </button>

  <div className="text-zinc-400">
    {expandedHistoryIndex === index ? "−" : "+"}
  </div>
</div>
        </button>

        {expandedHistoryIndex === index && (
          <div className="mt-3 space-y-3 text-sm text-zinc-300">
            {workout.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex}>
                <div className="font-medium text-white mb-1">
                  {exercise.name}
                </div>

                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="ml-2">
                    {set.type}: {set.actualWeight || "-"} kg ×{" "}
                    {set.actualReps || "-"}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
)}
{showEndWorkoutConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#121212] p-6 text-center">
      <div className="mb-4 text-5xl text-red-400">
        ⚠
      </div>

      <div className="mb-2 text-2xl font-semibold text-white">
        End Workout?
      </div>

      <div className="mb-6 text-sm leading-6 text-white/60">
        Are you sure you want to end the workout?
        <br />
        All current progress will be kept.
      </div>

      <button
onClick={() => {
  setShowEndWorkoutConfirm(false);
  handleFinishWorkout();
}}
        className="mb-3 w-full rounded-2xl border border-red-500/30 bg-red-600/20 py-3 text-sm font-medium text-red-300"
      >
        End Workout
      </button>

      <button
        onClick={() => setShowEndWorkoutConfirm(false)}
        className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 text-sm font-medium text-white"
      >
        Cancel
      </button>
    </div>
  </div>
)}

    </div>
  </div>
);
}