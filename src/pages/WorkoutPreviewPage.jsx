import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { getExerciseImage } from "../exerciseImages";
import { playFootballWhistle, preloadWorkoutSounds } from "../sounds";
import { getAmrapDurationMinutes, isAmrapDay } from "../schema";

const LAST_DAYS_KEY = "routine-last-days";

function readLastDays() {
  try {
    return JSON.parse(localStorage.getItem(LAST_DAYS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLastDay(routineKey, day) {
  const map = readLastDays();
  map[String(routineKey)] = day;
  localStorage.setItem(LAST_DAYS_KEY, JSON.stringify(map));
}

function getRoutineName(routines, routineKey) {
  return (
    routines?.[routineKey]?.name || `Routine ${Number(routineKey) + 1}`
  );
}

function getSetWeight(set) {
  return set?.actualWeight || set?.plannedWeight || set?.weight || "";
}

function getSetReps(set) {
  return set?.actualReps || set?.targetReps || set?.reps || "";
}

function isWarmOrRamp(set) {
  const type = String(set?.type || "").toLowerCase();
  return type.includes("warm") || type.includes("ramp");
}

function getExerciseSummary(exercise) {
  const sets = exercise?.sets || [];
  const setCount = sets.length;
  if (!setCount) return "No sets";

  let topWeight = null;
  for (const set of sets) {
    const weight = Number(getSetWeight(set));
    if (!Number.isFinite(weight)) continue;
    if (topWeight === null || weight > topWeight) topWeight = weight;
  }

  if (topWeight === null) {
    return `${setCount} ${setCount === 1 ? "set" : "sets"}`;
  }

  return `${setCount} ${setCount === 1 ? "set" : "sets"} · ${topWeight}kg top`;
}

export default function WorkoutPreviewPage(props) {
  const {
    data,
    selectedRoutine,
    setSelectedRoutine,
    selectedDay,
    setSelectedDay,
    setActiveTab,
    setSettingsSource,
    setActiveScreen,
    startWorkout,
    setActiveExerciseIndex,
    setActiveSetIndex,
    setWorkoutSeconds,
    setRestSeconds,
    setRestPaused,
    setWorkoutMode,
    setActiveWorkoutScreen,
    isPausedWorkout,
    setIsPausedWorkout,
  } = props;
  const currentRoutine = data?.routines?.[selectedRoutine];
  const currentDay = currentRoutine?.days?.[selectedDay];
  const routineKeys = Object.keys(data?.routines || {});
  const selectedRoutineName = getRoutineName(data?.routines, selectedRoutine);

  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [routineMenuOpen, setRoutineMenuOpen] = useState(false);
  const routineMenuRef = useRef(null);

  useEffect(() => {
    writeLastDay(selectedRoutine, selectedDay);
  }, [selectedRoutine, selectedDay]);

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

  function navigateWithTransition(callback, direction = "forward") {
    setTransitionDirection(direction);
    setIsTransitioning(true);

    setTimeout(() => {
      callback();
      setIsTransitioning(false);
    }, 250);
  }

  function switchRoutine(routineKey) {
    if (String(routineKey) === String(selectedRoutine)) {
      setRoutineMenuOpen(false);
      return;
    }

    if (isPausedWorkout) {
      const confirmed = window.confirm(
        "You have a paused workout. Switching routines may leave that session out of sync. Switch anyway?"
      );
      if (!confirmed) return;
    }

    writeLastDay(selectedRoutine, selectedDay);

    const lastDays = readLastDays();
    const dayCount = data?.routines?.[routineKey]?.days?.length || 0;
    const remembered = Number(lastDays[String(routineKey)]);
    const nextDay =
      Number.isFinite(remembered) && remembered >= 0 && remembered < dayCount
        ? remembered
        : 0;

    setSelectedRoutine(String(routineKey));
    setSelectedDay(nextDay);
    setRoutineMenuOpen(false);
  }

  function openRoutineEditor() {
    setRoutineMenuOpen(false);
    navigateWithTransition(() => {
      setSettingsSource("preview");
      setActiveTab("settings");
    }, "forward");
  }

  return (
  <>

<div className="pt-5 mb-3 grid grid-cols-[auto_1fr] items-center gap-2">

  {/* LEFT — Back */}
  <button
        onClick={() => {
        if (props.settingsSource === "preview") {
        props.setActiveTab("workout");
        } else {
         props.setActiveScreen("landing");
         }
        }}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md text-white text-base border-white/10 hover:bg-black/70 active:scale-[0.97] transition"
  >
  <ArrowLeft size={10} />
  </button>

  {/* CENTER — Selected routine dropdown */}
  <div className="relative min-w-0" ref={routineMenuRef}>
    <button
      type="button"
      onClick={() => setRoutineMenuOpen((open) => !open)}
      aria-haspopup="listbox"
      aria-expanded={routineMenuOpen}
      className="w-full inline-flex items-center justify-between gap-2 pl-2.5 pr-3 py-1.5 rounded-xl text-sm text-white/90 border border-white/15 bg-black/30 hover:bg-black/45 active:scale-[0.98] transition"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="h-7 w-[3px] shrink-0 rounded-full bg-[#c7a86a]/80" />
        <span className="min-w-0 text-left">
          <span className="block text-[10px] uppercase tracking-[0.14em] text-white/40 leading-none mb-0.5">
            Routine
          </span>
          <span className="block truncate font-semibold text-[#f0e6d0]">
            {selectedRoutineName}
          </span>
        </span>
      </span>
      <ChevronDown
        size={16}
        className={`shrink-0 text-white/60 transition-transform ${
          routineMenuOpen ? "rotate-180" : ""
        }`}
      />
    </button>

    {routineMenuOpen && (
      <div
        role="listbox"
        className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-white/15 bg-black/95 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
      >
        <div className="max-h-56 overflow-y-auto py-1">
          {routineKeys.length <= 1 ? (
            <div className="px-3 py-3 text-xs text-white/45">
              No other routines available
            </div>
          ) : (
            routineKeys.map((routineKey) => {
              const isSelected = String(routineKey) === String(selectedRoutine);
              return (
                <button
                  key={routineKey}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => switchRoutine(routineKey)}
                  className={`w-full px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-[#c7a86a]/20 text-[#d7c7a4]"
                      : "text-white/85 hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {getRoutineName(data?.routines, routineKey)}
                    </span>
                    {isSelected && (
                      <span className="shrink-0 text-[#c7a86a]">✓</span>
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
            onClick={openRoutineEditor}
            className="w-full px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/5 active:scale-[0.99] transition"
          >
            Edit routines
          </button>
        </div>
      </div>
    )}
  </div>

</div>

    {/* Day Selector — segmented rail */}
    <div className="relative mb-4">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-1 backdrop-blur-md">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {currentRoutine?.days?.map((day, index) => {
            const exerciseCount = day.exercises?.length || 0;
            const isSelected = index === selectedDay;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedDay(index)}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-left transition-all duration-200 active:scale-[0.98] ${
                  isSelected
                    ? "bg-[#c7a86a] text-black shadow-[0_0_18px_rgba(199,168,106,0.35)]"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div
                  className={`text-sm whitespace-nowrap leading-tight ${
                    isSelected ? "font-semibold" : "font-medium"
                  }`}
                >
                  {day.name}
                </div>
                <div
                  className={`mt-0.5 text-[10px] whitespace-nowrap uppercase tracking-wide ${
                    isSelected ? "text-black/55" : "text-white/35"
                  }`}
                >
                  {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-4 rounded-l-2xl bg-gradient-to-r from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-4 rounded-r-2xl bg-gradient-to-l from-black/50 to-transparent" />
    </div>

    {currentDay && (
      <div className="mb-3 px-1 text-xs text-white/45">
        {currentDay.name}
        <span className="text-white/25"> · </span>
        {isAmrapDay(currentDay) ? (
          <>
            AMRAP {getAmrapDurationMinutes(currentDay)} min
            <span className="text-white/25"> · </span>
            {currentDay.exercises?.length || 0} in circuit
          </>
        ) : (
          <>
            {currentDay.exercises?.length || 0}{" "}
            {(currentDay.exercises?.length || 0) === 1
              ? "exercise"
              : "exercises"}
          </>
        )}
      </div>
    )}

{/* EXERCISE CARDS */}
<div className="space-y-3 pb-36">
  {currentDay?.exercises?.map((exercise, i) => {
    const isExpanded = expandedExerciseIndex === i;
    const sets = exercise.sets || [];
    const visibleSets = sets.slice(0, 4);
    const extraSets = Math.max(0, sets.length - 4);
    const exerciseImage = getExerciseImage(exercise);

    return (
    <div
      key={i}
      onClick={() =>
        setExpandedExerciseIndex(isExpanded ? null : i)
      }
      className={`relative rounded-3xl border bg-black/40 backdrop-blur-md overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98] ${
        isExpanded
          ? "border-[#c7a86a66] shadow-[0_0_28px_rgba(199,168,106,0.28)]"
          : "border-white/10 shadow-[0_0_12px_rgba(0,0,0,0.25)]"
      }`}
    >
      {/* IMAGE */}
      <div
        className={`absolute right-0 top-0 h-full overflow-hidden transition-all duration-300 ${
          isExpanded ? "w-[40%]" : "w-[34%]"
        }`}
      >
        {exerciseImage ? (
          <img
            src={exerciseImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1814] via-[#0d0d0d] to-black" />
        )}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
      </div>

      {/* CONTENT */}
      <div
        className={`relative p-4 transition-all duration-300 ${
          isExpanded ? "pr-[42%]" : "pr-[36%]"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 w-7 h-7 shrink-0 flex items-center justify-center rounded-full border border-[#c7a86a40] text-[11px] text-[#d7c7a4]/70">
            {i + 1}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-white font-medium text-sm leading-snug">
              {exercise.name}
            </div>
            <div className="mt-1 text-[11px] text-white/40">
              {getExerciseSummary(exercise)}
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-300 overflow-hidden ${
            isExpanded
              ? "max-h-[220px] opacity-100 mt-3"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-wrap gap-1.5">
            {visibleSets.map((set, idx) => {
              const muted = isWarmOrRamp(set);
              const weight = getSetWeight(set) || "-";
              const reps = getSetReps(set) || "-";
              return (
                <div
                  key={idx}
                  className={`rounded-lg border px-2 py-1.5 text-center min-w-[3.4rem] ${
                    muted
                      ? "border-white/8 bg-white/[0.03] text-white/45"
                      : "border-[#c7a86a33] bg-[#c7a86a12] text-[#e6d7b4]"
                  }`}
                >
                  <div className="text-[9px] uppercase tracking-wide opacity-60">
                    {idx + 1}
                  </div>
                  <div className="text-[11px] font-semibold leading-tight">
                    {weight}×{reps}
                  </div>
                </div>
              );
            })}
            {extraSets > 0 && (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-white/45 self-center">
                +{extraSets} more
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  })}
</div>

<div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-5 pt-8 bg-gradient-to-t from-black via-black/90 to-transparent">
  <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/55 backdrop-blur-md p-2.5">
  {/* Resume Button */}
  {isPausedWorkout && (
    <button
      onClick={() => {
        const saved = JSON.parse(
          localStorage.getItem("active-workout-state") || "null"
        );

        if (saved?.selectedRoutine !== undefined) {
          setSelectedRoutine(saved.selectedRoutine);
        }
        if (saved?.selectedDay !== undefined) {
          setSelectedDay(saved.selectedDay);
        }
        if (saved?.activeExerciseIndex !== undefined) {
          setActiveExerciseIndex(saved.activeExerciseIndex);
        }
        if (saved?.activeSetIndex !== undefined) {
          setActiveSetIndex(saved.activeSetIndex);
        }
        if (saved?.workoutSeconds !== undefined) {
          setWorkoutSeconds(Number(saved.workoutSeconds) || 0);
        }
        if (saved?.restSeconds !== undefined) {
          setRestSeconds(saved.restSeconds || 0);
        }

        setRestPaused(false);
        setIsPausedWorkout(false);
        setActiveWorkoutScreen(saved?.activeWorkoutScreen || "active");
        setActiveTab("workout");
        setWorkoutMode(true);
        preloadWorkoutSounds();
        playFootballWhistle();
      }}
      className="w-full rounded-xl p-3.5 text-sm font-semibold border border-[#c7a86a55] bg-transparent text-[#d7c7a4] transition-all duration-150 active:scale-[0.97]"
    >
      Resume Workout
    </button>
  )}

  {/* Start Fresh */}
  <button
    onClick={startWorkout}
    className="w-full rounded-xl p-3.5 text-sm font-semibold bg-gradient-to-r from-[#c7a86a]/80 to-[#d7c7a4]/75 text-black shadow-[0_0_24px_rgba(199,168,106,0.4)] transition-all duration-150 active:scale-[0.97]"
  >
    {isAmrapDay(currentDay) ? "Start AMRAP" : "Start Workout"}
  </button>
  </div>
</div>

  </>
);
}