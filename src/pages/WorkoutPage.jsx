import { useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from "@dnd-kit/sortable";

import bellSound from "../Assets/sounds/rest-complete/timer-end-bell.mp3";
import { useRef } from "react";

import { CSS } from "@dnd-kit/utilities";
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
export default function WorkoutPage(props) { 
    const {
  startWorkout,
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
  handleAdvanceWorkout,
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
  setExpandedHistoryIndex,
  advanceWorkout,
} = props;

const bellRef = useRef(null);
if (!bellRef.current) {
  bellRef.current = new Audio(bellSound);
}

  return (
    <>
      {activeTab === "workout" &&
 !workoutMode &&
 activeWorkoutScreen !== "summary" && (
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
            <div className="mb-4 relative flex items-center justify-left text-sm text-white/70">
              <button
                onClick={() => setWorkoutMode(false)}
                className="text-xl leading-none text-white/70"
              >
                ←
              </button>
      
              <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-lg font-semibold text-white">
                  {currentDay.name}
                </div>
              </div>
            </div>
      
            <div className="mb-3 flex items-center justify-between text-xs text-white/60">
              <div>
                Workout Time
              </div>
      
              <div className="font-mono text-sm text-white">
                {formatTime(workoutSeconds)}
              </div>
            </div>
      
<div className="flex justify-between items-start mb-2">

  {/* LEFT — Exercise dots */}
  <div className="flex flex-col items-start">
    <div className="flex gap-1">
      {currentDay.exercises.map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= activeExerciseIndex
              ? "bg-green-500"
              : "bg-white/20"
          }`}
        />
      ))}
    </div>
    <div className="text-[10px] text-white/50 mt-1">
      Exercises
    </div>
  </div>

  {/* RIGHT — Set dots */}
  <div className="flex flex-col items-end">
    <div className="flex gap-1">
      {activeExercise.sets.map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= activeSetIndex
              ? "bg-green-500"
              : "bg-white/20"
          }`}
        />
      ))}
    </div>
    <div className="text-[10px] text-white/50 mt-1">
      Sets
    </div>
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
<div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              inputMode="decimal"
              value={
                      activeSet.actualWeight === undefined
                      ? activeSet.plannedWeight || ""
                      : activeSet.actualWeight
                    }
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
              value={
                      activeSet.actualReps === undefined
                      ? activeSet.targetReps || ""
                      : activeSet.actualReps
                    }
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
        <div>
        </div>
      </div>
            <div className="flex gap-3 mt-3">
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
       className="flex-[0.8] rounded-xl py-3 text-sm text-white/40 bg-transparent active:scale-95 transition-all"
      >
        Previous
      </button>
      
      <button
        onClick={() => {
        setSkippedSets((prev) => prev + 1);
        advanceWorkout();
}}
       className="flex-[1.2] rounded-xl py-3 text-sm border border-yellow-500/30 text-yellow-400/80 bg-transparent ..."
      >
        Skip Set
      </button>
      
              <button
                onClick={advanceWorkout}
                className="flex-[2] rounded-xl py-3 text-sm font-medium bg-blue-600 text-white shadow-lg active:scale-95 transition-all"
              >
                {isFinalSetOfWorkout
                  ? "Finish Workout"
                  : isLastSetOfExercise
                  ? "Next Exercise"
                  : "Next Set"}
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
activeWorkoutScreen === null && (
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
           onClick={startWorkout}
            className="w-full mt-4 p-4 rounded-3xl bg-gradient-to-r from-fuchsia-600 to-purple-500 text-xl font-bold text-white shadow-lg"
          >
            Start Scheduled Workout
          </button>
        </>
      )}
        </>
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

    </>
  );
}