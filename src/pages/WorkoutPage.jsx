import { useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from "@dnd-kit/sortable";

import { useMemo } from "react";
import { getExerciseImage } from "../exerciseImages";
import WheelDial, {
  buildRepValues,
  buildWeightValues,
} from "../components/WheelDial";
import {
  BW_WEIGHT_RE,
  buildBandDialValues,
  formatCircuitPrescription,
  formatTargetLine,
  getLoggingModeMeta,
  getPlannedLoad,
  getPlannedValue,
  getValueUnitLabel,
  inferLoggingMode,
  normalizeBandLabel,
} from "../loggingModes";
import { getAmrapDurationMinutes, isAmrapDay } from "../schema";

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
  handleAdvanceWorkout,
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
  advanceWorkout,
  setIsPausedWorkout,
  amrapCircuitsCompleted,
  amrapSecondsRemaining,
  amrapPartialEntries,
  completeAmrapCircuit,
  undoAmrapCircuit,
  updateAmrapPartialEntry,
  finishAmrapWithPartial,
  finishAmrapWithoutPartial,
} = props;

  const amrapDay = isAmrapDay(currentDay);
  const isAmrapSummary =
    completedWorkout?.type === "amrap" ||
    Array.isArray(completedWorkout?.circuit);

const activeExerciseImage = getExerciseImage(activeExercise);
const loggingMode = inferLoggingMode(activeExercise);
const loggingMeta = getLoggingModeMeta(loggingMode);

const weightDialValues = useMemo(() => {
  if (loggingMode === "band") {
    return buildBandDialValues([
      activeSet?.plannedWeight,
      activeSet?.weight,
      activeSet?.actualWeight,
    ]);
  }

  if (loggingMode === "time") {
    const numeric = buildWeightValues({
      include: [activeSet?.plannedWeight, activeSet?.weight],
    });
    return ["BW", ...numeric.filter((v) => v !== "0")];
  }

  return buildWeightValues({
    include: [activeSet?.plannedWeight, activeSet?.weight],
  });
}, [
  loggingMode,
  activeSet?.plannedWeight,
  activeSet?.weight,
  activeSet?.actualWeight,
]);

const repDialValues = useMemo(
  () =>
    buildRepValues({
      min: 0,
      max: loggingMode === "time" ? 300 : 50,
      include: [activeSet?.targetReps, activeSet?.reps, activeSet?.actualReps],
    }),
  [
    loggingMode,
    activeSet?.targetReps,
    activeSet?.reps,
    activeSet?.actualReps,
  ]
);

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
      {activeTab === "workout" &&
        workoutMode &&
        activeWorkoutScreen === "amrap-active" &&
        amrapDay && (
          <div className="flex min-h-[calc(100vh-2rem)] flex-col">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="mb-4 relative flex items-center text-sm text-white/70">
                <button
                  onClick={() => setShowEndWorkoutConfirm(true)}
                  className="text-xl leading-none text-white/70"
                >
                  ←
                </button>
                <div className="absolute left-1/2 max-w-[75%] -translate-x-1/2 truncate text-center text-lg font-semibold text-white">
                  {currentDay?.name}{" "}
                  <span className="font-normal text-white/55">| AMRAP</span>
                </div>
              </div>

              <div className="mb-4 flex justify-center">
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-[#c7a86a66] bg-black/30">
                  <div className="text-center">
                    <div className="font-mono text-4xl text-white">
                      {formatTime(amrapSecondsRemaining)}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">
                      Remaining
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
                  <div className="text-3xl font-semibold text-white">
                    {amrapCircuitsCompleted}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Circuits
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
                  <div className="text-3xl font-semibold text-white">
                    {getAmrapDurationMinutes(currentDay)}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Minutes
                  </div>
                </div>
              </div>

              <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-white/45">
                Circuit
              </div>
              <div className="mb-4 space-y-2">
                {(currentDay?.exercises || []).map((exercise, index) => (
                  <div
                    key={`${exercise.name}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#c7a86a40] text-[11px] text-[#d7c7a4]/70">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">
                          {exercise.name}
                        </div>
                        <div className="text-sm text-white/55">
                          {formatCircuitPrescription(exercise)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={completeAmrapCircuit}
                className="mb-2 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white shadow-lg active:scale-[0.98] transition-all"
              >
                Circuit Done (+1)
              </button>
              <button
                onClick={undoAmrapCircuit}
                disabled={!amrapCircuitsCompleted}
                className="w-full rounded-xl py-2.5 text-sm text-white/45 disabled:opacity-30 active:scale-95 transition-all"
              >
                Undo last circuit
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
        activeWorkoutScreen === "amrap-partial" &&
        amrapDay && (
          <div className="flex min-h-[calc(100vh-2rem)] flex-col">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="mb-2 text-center text-2xl font-semibold text-white">
                Time’s up
              </div>
              <div className="mb-4 text-center text-sm text-white/60">
                You finished {amrapCircuitsCompleted} full circuit
                {amrapCircuitsCompleted === 1 ? "" : "s"}. Log anything you
                completed in the incomplete circuit.
              </div>

              <div className="mb-4 space-y-3">
                {(amrapPartialEntries || []).map((entry, index) => (
                  <div
                    key={`${entry.name}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/30 p-3"
                  >
                    <div className="mb-1 font-medium text-white">
                      {entry.name}
                    </div>
                    <div className="mb-2 text-xs text-white/45">
                      Target{" "}
                      {formatCircuitPrescription({
                        name: entry.name,
                        loggingMode: entry.loggingMode,
                        sets: [
                          {
                            plannedWeight: entry.plannedWeight,
                            weight: entry.plannedWeight,
                            targetReps: entry.targetReps,
                            reps: entry.targetReps,
                          },
                        ],
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        inputMode="text"
                        placeholder="Load done"
                        value={entry.actualWeight}
                        onChange={(e) =>
                          updateAmrapPartialEntry(
                            index,
                            "actualWeight",
                            e.target.value
                          )
                        }
                        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center text-sm text-white placeholder:text-white/25"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Reps/secs done"
                        value={entry.actualReps}
                        onChange={(e) =>
                          updateAmrapPartialEntry(
                            index,
                            "actualReps",
                            e.target.value
                          )
                        }
                        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center text-sm text-white placeholder:text-white/25"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                disabled={endWorkoutBusy}
                onClick={finishAmrapWithPartial}
                className="mb-2 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Save with partial circuit
              </button>
              <button
                disabled={endWorkoutBusy}
                onClick={finishAmrapWithoutPartial}
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 text-sm text-white/70 disabled:opacity-50"
              >
                Skip partial — save full circuits only
              </button>
            </div>
          </div>
        )}

      {activeTab === "workout" && workoutMode && activeWorkoutScreen === "active" && (
        <div className="flex min-h-[calc(100vh-2rem)] flex-col">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <div className="mb-4 relative flex items-center justify-left text-sm text-white/70">
              <button
               onClick={() => setShowEndWorkoutConfirm(true)}
               className="text-xl leading-none text-white/70"
               >
                ←
                </button>
      
              <div className="absolute left-1/2 max-w-[70%] -translate-x-1/2 transform text-center">
                <div className="truncate text-lg font-semibold text-white">
                  {currentDay.name}
                  {activeExercise?.name ? (
                    <span className="font-normal text-white/60">
                      {" "}
                      | {activeExercise.name}
                    </span>
                  ) : null}
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
    <div className="flex gap-1.5">
      {currentDay.exercises.map((_, i) => (
        <div
          key={i}
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
            i <= activeExerciseIndex
              ? "bg-green-500 text-black"
              : "bg-white/20 text-white/50"
          }`}
        >
          {i + 1}
        </div>
      ))}
    </div>
    <div className="text-[10px] text-white/50 mt-1">
      Exercises
    </div>
  </div>

  {/* RIGHT — Set dots */}
  <div className="flex flex-col items-end">
    <div className="flex gap-1.5">
      {(activeExercise?.sets || []).map((_, i) => (
        <div
          key={i}
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
            i <= activeSetIndex
              ? "bg-green-500 text-black"
              : "bg-white/20 text-white/50"
          }`}
        >
          {i + 1}
        </div>
      ))}
    </div>
    <div className="text-[10px] text-white/50 mt-1">
      Sets
    </div>
  </div>

</div>
      
            <div className="mb-4 flex h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {activeExerciseImage ? (
                <img
                  src={activeExerciseImage}
                  alt={activeExercise?.name || "Exercise"}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.3em] text-white/30">
                  No Image
                </div>
              )}
            </div>
      
            {activeExercise && activeSet ? (() => {
              const plannedWeight = getPlannedLoad(activeSet);
              const plannedReps = getPlannedValue(activeSet);
              const valueUnit = getValueUnitLabel(loggingMode);
              const showLoadDial = loggingMeta.showLoad;
              const isBand = loggingMode === "band";
              const isBodyweight = loggingMode === "bodyweight";

              const actualWeightValue =
                activeSet.actualWeight === undefined
                  ? isBand
                    ? normalizeBandLabel(plannedWeight) || "Red"
                    : isBodyweight || BW_WEIGHT_RE.test(plannedWeight)
                      ? "BW"
                      : plannedWeight || ""
                  : isBand
                    ? normalizeBandLabel(activeSet.actualWeight)
                    : activeSet.actualWeight;

              const actualRepsValue =
                activeSet.actualReps === undefined
                  ? plannedReps || ""
                  : activeSet.actualReps;

              const plannedWeightNum = Number(plannedWeight);
              const actualWeightNum = Number(actualWeightValue);
              const plannedRepsNum = Number(plannedReps);
              const actualRepsNum = Number(actualRepsValue);

              const weightDelta =
                !isBand &&
                !isBodyweight &&
                !BW_WEIGHT_RE.test(String(plannedWeight)) &&
                Number.isFinite(plannedWeightNum) &&
                Number.isFinite(actualWeightNum)
                  ? actualWeightNum - plannedWeightNum
                  : null;
              const repsDelta =
                Number.isFinite(plannedRepsNum) &&
                Number.isFinite(actualRepsNum)
                  ? actualRepsNum - plannedRepsNum
                  : null;

              const formatDelta = (delta, unit) => {
                if (delta === null || delta === 0) return null;
                const sign = delta > 0 ? "+" : "";
                return `${sign}${delta}${unit}`;
              };

              const weightDeltaLabel = formatDelta(weightDelta, " kg");
              const repsDeltaLabel = formatDelta(
                repsDelta,
                valueUnit === "secs" ? " secs" : " reps"
              );
              const matchingPlanned =
                String(actualWeightValue).toLowerCase() ===
                  String(
                    isBand
                      ? normalizeBandLabel(plannedWeight)
                      : isBodyweight || BW_WEIGHT_RE.test(plannedWeight)
                        ? "BW"
                        : plannedWeight || ""
                  ).toLowerCase() &&
                String(actualRepsValue) === String(plannedReps || "");

              const loadUnit = isBand ? "" : loggingMode === "time" ? "" : "kg";

              return (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="text-sm text-white/55">
                      {formatTargetLine(activeExercise, activeSet)}
                    </div>
                    {activeSet.type ? (
                      <div className="shrink-0 rounded-full border border-[#4da3ff]/40 bg-[#4da3ff]/15 px-2.5 py-1 text-[11px] font-medium text-[#4da3ff]">
                        {activeSet.type}
                      </div>
                    ) : null}
                  </div>

                  <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                        Actual
                      </div>
                      {matchingPlanned ? (
                        <div className="text-[11px] text-white/35">
                          Same as planned
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={`grid gap-3 ${
                        showLoadDial || isBodyweight
                          ? "grid-cols-2"
                          : "grid-cols-1"
                      }`}
                    >
                      {isBodyweight ? (
                        <div className="flex h-11 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xl font-semibold text-white">
                          BW
                        </div>
                      ) : showLoadDial ? (
                        <WheelDial
                          values={weightDialValues}
                          value={actualWeightValue}
                          unit={loadUnit}
                          onChange={(next) =>
                            updateSet(
                              activeExerciseIndex,
                              activeSetIndex,
                              "actualWeight",
                              isBand ? normalizeBandLabel(next) : next
                            )
                          }
                          className="rounded-xl border border-white/10 bg-black/40"
                        />
                      ) : null}

                      <WheelDial
                        values={repDialValues}
                        value={actualRepsValue}
                        unit={valueUnit}
                        onChange={(next) =>
                          updateSet(
                            activeExerciseIndex,
                            activeSetIndex,
                            "actualReps",
                            next
                          )
                        }
                        className="rounded-xl border border-white/10 bg-black/40"
                      />
                    </div>

                    {(weightDeltaLabel || repsDeltaLabel) && (
                      <div className="mt-3 flex gap-3 text-xs text-white/55">
                        {weightDeltaLabel ? (
                          <span>{weightDeltaLabel}</span>
                        ) : null}
                        {repsDeltaLabel ? <span>{repsDeltaLabel}</span> : null}
                      </div>
                    )}
                  </div>

                  <div className="mt-1 space-y-2.5">
                    <button
                      onClick={advanceWorkout}
                      className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white shadow-lg active:scale-[0.98] transition-all"
                    >
                      {isFinalSetOfWorkout
                        ? "Finish Workout"
                        : isLastSetOfExercise
                        ? "Next Exercise"
                        : "Next Set"}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (activeSetIndex > 0) {
                            setActiveSetIndex((prev) => prev - 1);
                          } else if (activeExerciseIndex > 0) {
                            const previousExercise =
                              currentDay.exercises[activeExerciseIndex - 1];

                            setActiveExerciseIndex((prev) => prev - 1);
                            setActiveSetIndex(
                              previousExercise.sets.length - 1
                            );
                          }
                        }}
                        className="flex-1 rounded-xl py-2.5 text-sm text-white/45 active:scale-95 transition-all"
                      >
                        ← Previous
                      </button>

                      <button
                        onClick={() => {
                          setSkippedSets((prev) => prev + 1);
                          advanceWorkout();
                        }}
                        className="flex-1 rounded-xl border border-yellow-500/25 bg-transparent py-2.5 text-sm text-yellow-400/75 active:scale-95 transition-all"
                      >
                        Skip Set
                      </button>

                      <button
                        onClick={skipExercise}
                        className="flex-1 rounded-xl border border-orange-500/35 bg-orange-600/15 py-2.5 text-sm text-orange-300 active:scale-95 transition-all"
                      >
                        Skip Exercise
                      </button>
                    </div>
                  </div>
                </>
              );
            })() : null}
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
                  {activeExercise?.name}
                </div>
      
                <div className="mt-1 text-sm text-white/70">
                  {activeExercise?.sets?.[activeSetIndex + 1]?.type}
                </div>
      
                <div className="mt-3 text-base text-white">
                  {formatTargetLine(
                    activeExercise,
                    activeExercise?.sets?.[activeSetIndex + 1]
                  ).replace(/^Target ·\s*/, "")}
                </div>
              </div>
              <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/50">
          Exercise Remarks
        </div>
      
        <textarea
          value={activeExercise?.remarks || ""}
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
                  {currentDay.exercises[activeExerciseIndex + 1]?.sets?.length || 0} Sets Planned
                </div>
      
                <div className="mt-4 text-sm text-white/60">
                  First Set Target
                </div>
      
                <div className="text-base text-white">
                  {formatTargetLine(
                    currentDay.exercises[activeExerciseIndex + 1],
                    currentDay.exercises[activeExerciseIndex + 1]?.sets?.[0]
                  ).replace(/^Target ·\s*/, "")}
                </div>
              </div>
      <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/50">
          Exercise Remarks
        </div>
      
        <textarea
          value={activeExercise?.remarks || ""}
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
        activeWorkoutScreen === "stretch" && (
          <div className="flex min-h-[calc(100vh-2rem)] flex-col justify-center">
            <div className="rounded-3xl border border-sky-400/30 bg-black/50 p-5 backdrop-blur-md">
              <div className="text-[11px] uppercase tracking-[0.28em] text-sky-300/80 mb-2">
                {stretchOnlyMode ? "Stretch session" : "After workout"}
              </div>
              <div className="text-2xl font-semibold text-white mb-1">
                Stretch / Mobility
              </div>
              <div className="text-sm text-white/55 mb-6">
                {stretchOnlyMode
                  ? "Start the timer and name this routine."
                  : "Workout is saved. Time this stretch separately, or skip."}
              </div>

              <div className="mb-6 text-center">
                <div className="text-5xl font-semibold tabular-nums text-sky-200 tracking-tight">
                  {formatTime(stretchSeconds)}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Stretch timer
                </div>
              </div>

              <label className="block mb-2 text-[10px] uppercase tracking-[0.2em] text-[#d7c7a4]/80">
                Routine name
              </label>
              <input
                type="text"
                value={stretchRoutineName}
                onChange={(e) => setStretchRoutineName(e.target.value)}
                placeholder="e.g. Hip mobility"
                className="w-full mb-3 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-3 text-sm text-white placeholder:text-white/30"
              />

              {stretchRoutineNames?.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {stretchRoutineNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setStretchRoutineName(name)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs transition active:scale-[0.98] ${
                        stretchRoutineName === name
                          ? "border-sky-300 bg-sky-500/25 text-sky-100"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-sky-400/40"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={endWorkoutBusy}
                  onClick={() => void finishStretchSession()}
                  className="w-full rounded-2xl bg-sky-400 text-black font-medium py-3 text-sm active:scale-[0.98] transition disabled:opacity-50"
                >
                  Finish stretch
                </button>
                <button
                  type="button"
                  disabled={endWorkoutBusy}
                  onClick={() => void skipStretchSession()}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/70 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {stretchOnlyMode ? "Cancel" : "Skip stretch"}
                </button>
              </div>
            </div>
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
                Total{" "}
                {formatTime(
                  (finalWorkoutSeconds || 0) +
                    (completedStretch?.durationSeconds || 0)
                )}
              </div>
      
      <div className="mb-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-2xl font-semibold text-white">
                    {isAmrapSummary
                      ? completedWorkout?.circuitsCompleted || 0
                      : completedWorkout?.exercises?.length || 0}
                  </div>
      
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">
                    {isAmrapSummary ? "Circuits" : "Exercises"}
                  </div>
                </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-2xl font-semibold text-white">
          {formatTime(finalWorkoutSeconds)}
        </div>
      
        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">
          Workout
        </div>
      </div>
      </div>

      {completedStretch && (
        <div className="mb-6 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 text-left">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-sky-300/80">
            Stretch / Mobility
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 truncate text-sm text-white">
              {completedStretch.name || "Stretch / Mobility"}
            </div>
            <div className="shrink-0 text-sm font-semibold text-sky-200">
              {formatTime(completedStretch.durationSeconds || 0)}
            </div>
          </div>
        </div>
      )}

              <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/50">
          Workout Details
        </div>
      
        <div className="space-y-3">
          {isAmrapSummary ? (
            <>
              <div className="text-sm text-white/70">
                Full circuits:{" "}
                <span className="font-semibold text-white">
                  {completedWorkout?.circuitsCompleted || 0}
                </span>
              </div>
              {(completedWorkout?.circuit || []).map((item, index) => (
                <div key={`circuit-${index}`} className="text-sm text-white">
                  <span className="font-semibold text-[#f5e7c8]">
                    {item.name}
                  </span>
                  {" : "}
                  {item.plannedWeight || "-"} × {item.targetReps || "-"}
                </div>
              ))}
              {!(completedWorkout?.circuit || []).length && (
                <div className="text-sm text-white/45">
                  No circuit exercises found for this session.
                </div>
              )}
              {completedWorkout?.partialCircuit?.length > 0 && (
                <div className="pt-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-yellow-400/70">
                    Partial circuit
                  </div>
                  {completedWorkout.partialCircuit.map((item, index) => (
                    <div key={`partial-${index}`} className="text-sm text-white">
                      <span className="font-semibold text-[#f5e7c8]">
                        {item.name}
                      </span>
                      {" : "}
                      {item.actualWeight || item.plannedWeight || "-"} ×{" "}
                      {item.actualReps || "0"}
                      {item.targetReps ? ` / ${item.targetReps}` : ""}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            completedWorkout?.exercises?.map((exercise, index) => (
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
          ))
          )}
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
              Choose how you want to leave this session.
            </div>

            <button
              disabled={endWorkoutBusy}
              onClick={() => void pauseAndExitWorkout()}
              className="mb-3 w-full rounded-2xl border border-yellow-500/30 bg-yellow-600/20 py-3 text-sm font-medium text-yellow-300 disabled:opacity-50"
            >
              {endWorkoutBusy ? "Saving..." : "Pause & Resume Later"}
            </button>

            <button
              disabled={endWorkoutBusy}
              onClick={() => {
                if (amrapDay) {
                  void finishAmrapWithoutPartial();
                } else {
                  void endAndSaveWorkout();
                }
              }}
              className="mb-3 w-full rounded-2xl border border-green-500/30 bg-green-600/20 py-3 text-sm font-medium text-green-300 disabled:opacity-50"
            >
              End & Save Progress
            </button>

            <button
              disabled={endWorkoutBusy}
              onClick={() => void endAndDiscardWorkout()}
              className="mb-3 w-full rounded-2xl border border-red-500/30 bg-red-600/20 py-3 text-sm font-medium text-red-300 disabled:opacity-50"
            >
              End & Discard Progress
            </button>

            <button
              disabled={endWorkoutBusy}
              onClick={() => setShowEndWorkoutConfirm(false)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </>
  );
}