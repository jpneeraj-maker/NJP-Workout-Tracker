import React from "react";
import {
  ArrowLeft,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  createEmptySet,
  createExercise,
  createRestEntry,
  createStretchEntry,
  createWorkoutEntry,
  formatDurationSeconds,
  getEntryDurationSeconds,
  groupHistoryByDate,
  isRestEntry,
  isSessionEntry,
  isStretchEntry,
  upsertDaySession,
  upsertDayStretch,
} from "../schema";

function formatDateLabel(dateKey) {
  if (!dateKey) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

/** Longest activity streak allowing a single off day between hits. */
function longestStreakWithGrace(activeFlags, maxGap = 1) {
  let best = 0;
  let current = 0;
  let gap = 0;

  for (const active of activeFlags) {
    if (active) {
      current += 1;
      gap = 0;
      if (current > best) best = current;
      continue;
    }

    gap += 1;
    if (gap > maxGap) {
      current = 0;
    }
  }

  return best;
}

export default function HistoryPage(props) {
  const {
    workoutHistory,
    setWorkoutHistory,
    setActiveScreen,
    setActiveTab,
    routines,
  } = props;

  const [selectedRoutine, setSelectedRoutine] = React.useState(null);
  const [selectedDay, setSelectedDay] = React.useState(null);
  const [expandedExerciseIndex, setExpandedExerciseIndex] =
    React.useState(null);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [showLogOptions, setShowLogOptions] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editableWorkout, setEditableWorkout] = React.useState(null);
  const [pendingDelete, setPendingDelete] = React.useState(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const historyByDate = React.useMemo(
    () => groupHistoryByDate(workoutHistory),
    [workoutHistory]
  );

  React.useEffect(() => {
    setSelectedDate(getTodayKey());
  }, []);

  React.useEffect(() => {
    setPendingDelete(null);
    setExpandedExerciseIndex(null);
  }, [selectedDate]);

  const dayBucket = selectedDate ? historyByDate[selectedDate] : null;
  const selectedSession = dayBucket?.session || null;
  const selectedRest = dayBucket?.rest || null;
  const selectedStretch = dayBucket?.stretch || null;
  const activeWorkout = isEditing ? editableWorkout : selectedSession;
  const todayKey = getTodayKey();
  const isFutureDate = selectedDate && selectedDate > todayKey;

  const monthStats = React.useMemo(() => {
    let workouts = 0;
    let rest = 0;
    let stretch = 0;
    const daysInView = new Date(currentYear, currentMonth + 1, 0).getDate();
    const byDate = groupHistoryByDate(workoutHistory);
    const workoutFlags = [];
    const stretchFlags = [];

    for (let day = 1; day <= daysInView; day += 1) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const bucket = byDate[dateKey];
      const hasWorkout = Boolean(bucket?.session);
      const hasStretch = Boolean(bucket?.stretch);

      if (hasStretch) stretch += 1;
      if (hasWorkout) workouts += 1;
      if (bucket?.rest) rest += 1;

      workoutFlags.push(hasWorkout);
      stretchFlags.push(hasStretch);
    }

    return {
      workouts,
      rest,
      stretch,
      workoutStreak: longestStreakWithGrace(workoutFlags, 1),
      stretchStreak: longestStreakWithGrace(stretchFlags, 1),
    };
  }, [workoutHistory, currentMonth, currentYear]);

  const deletePendingEntry = () => {
    if (!selectedDate || !pendingDelete) return;

    const updatedHistory = workoutHistory.filter((w) => {
      if (w.saveKey !== selectedDate) return true;
      if (pendingDelete === "stretch") return !isStretchEntry(w);
      if (pendingDelete === "session") {
        return !(isSessionEntry(w) || isRestEntry(w));
      }
      return true;
    });

    setWorkoutHistory(updatedHistory);
    setPendingDelete(null);
    setIsEditing(false);
    setEditableWorkout(null);
  };

  const markStretchDone = () => {
    if (!selectedDate || isFutureDate || selectedStretch) return;
    setWorkoutHistory(
      upsertDayStretch(workoutHistory, createStretchEntry(selectedDate))
    );
  };

  const panelBorder = selectedRest
    ? "border-emerald-500/25"
    : "border-[#c7a86a55]";

  return (
    <>
      <div className="pt-4 mb-3 relative flex items-center justify-center">
        <div className="absolute left-0">
          <button
            onClick={() => {
              window.history.pushState({}, "");
              setActiveScreen("landing");
            }}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-black/35 backdrop-blur-sm text-[#d7c7a4] border border-[#c7a86a55] hover:bg-black/50 active:scale-[0.97] transition"
          >
            <ArrowLeft size={14} />
          </button>
        </div>

        <div className="text-center text-xl font-semibold text-white">
          Workout History
        </div>

        <div className="absolute right-0">
          <button
            onClick={() => {
              if (typeof setActiveTab === "function") {
                setActiveTab("analytics");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-black/35 backdrop-blur-sm text-[#d7c7a4] border border-[#c7a86a55] hover:bg-black/50 active:scale-[0.97] transition"
            title="Analytics"
          >
            <ChartNoAxesCombined size={16} />
          </button>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-2 mb-3 text-white/80">
        <button
          className="p-2 rounded-lg border border-white/10 bg-black/20 text-[#d7c7a4] active:scale-95 transition"
          onClick={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear((prev) => prev - 1);
            } else {
              setCurrentMonth((prev) => prev - 1);
            }
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium text-[#d7c7a4] bg-black/30 border border-[#c7a86a40] px-4 py-1.5 rounded-lg min-w-[9.5rem] text-center">
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <button
          className="p-2 rounded-lg border border-white/10 bg-black/20 text-[#d7c7a4] active:scale-95 transition"
          onClick={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear((prev) => prev + 1);
            } else {
              setCurrentMonth((prev) => prev + 1);
            }
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Month strip */}
      <div className="mb-3 flex justify-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-[#c7a86a40] bg-black/55 backdrop-blur-md px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-[#d7c7a4]">
          <span>
            <span className="font-semibold text-white">{monthStats.workouts}</span>{" "}
            <span className="text-[#d7c7a4]/90">workouts</span>
          </span>
          <span className="text-[#c7a86a66]">·</span>
          <span>
            <span className="font-semibold text-emerald-300">{monthStats.rest}</span>{" "}
            <span className="text-[#d7c7a4]/90">rest</span>
          </span>
          <span className="text-[#c7a86a66]">·</span>
          <span>
            <span className="font-semibold text-sky-300">{monthStats.stretch}</span>{" "}
            <span className="text-[#d7c7a4]/90">stretch</span>
          </span>
          <span className="text-[#c7a86a66]">·</span>
          <span>
            <span className="font-semibold text-white">
              {monthStats.workoutStreak}
            </span>{" "}
            <span className="text-[#d7c7a4]/90">w streak</span>
          </span>
          <span className="text-[#c7a86a66]">·</span>
          <span>
            <span className="font-semibold text-sky-300">
              {monthStats.stretchStreak}
            </span>{" "}
            <span className="text-[#d7c7a4]/90">s streak</span>
          </span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-black/40 backdrop-blur-md border border-[#c7a86a55] rounded-2xl p-4 shadow-lg shadow-black/40 mb-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-[#d7c7a4]/80 mb-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs text-white/80">
          {[
            ...Array(startOffset).fill(null),
            ...Array(daysInMonth).keys(),
          ].map((day, i) => {
            if (day === null) {
              return <div key={i} />;
            }

            const date = day + 1;
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
            const bucket = historyByDate[dateKey];
            const hasSession = Boolean(bucket?.session);
            const isRest = Boolean(bucket?.rest);
            const hasStretch = Boolean(bucket?.stretch);
            const isLogged = hasSession || isRest || hasStretch;
            const isSelected = selectedDate === dateKey;
            const isToday = dateKey === todayKey;
            const isFuture = dateKey > todayKey;

            return (
              <div
                key={i}
                onClick={() => {
                  if (isFuture) return;
                  setSelectedDate(dateKey);
                  setIsEditing(false);
                  setEditableWorkout(null);
                }}
                className={`h-11 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200 ease-out active:scale-95
                  ${isFuture ? "opacity-30 pointer-events-none" : ""}
                  ${
                    isSelected
                      ? "bg-[#c7a86a33] border border-[#c7a86a] shadow-md shadow-black/30 scale-105"
                      : hasSession
                        ? "bg-[#c7a86a22] border border-[#c7a86a40] hover:bg-[#c7a86a33]"
                        : isRest
                          ? "bg-emerald-500/15 border border-emerald-400/30 hover:bg-emerald-500/25"
                          : hasStretch
                            ? "bg-sky-500/10 border border-sky-400/25 hover:bg-sky-500/20"
                            : "bg-black/40 border border-transparent hover:bg-white/10"
                  }
                  ${isToday && !isSelected ? "ring-1 ring-[#c7a86a66]" : ""}
                `}
              >
                <div className="text-white font-medium leading-none">
                  {date}
                </div>
                {isLogged && (
                  <div className="mt-1 flex items-center justify-center gap-0.5">
                    {(hasSession || isRest) && (
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isRest ? "bg-emerald-400" : "bg-[#c7a86a]"
                        }`}
                      />
                    )}
                    {hasStretch && (
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.16em] text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#c7a86a]" />
            Workout
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Rest
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            Stretch
          </span>
        </div>
      </div>

      {/* Selected day panel */}
      <div
        className={`mt-2 bg-black/40 backdrop-blur-md border ${panelBorder} rounded-2xl p-4 shadow-lg shadow-black/40`}
      >
        <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#d7c7a4]/70">
          {formatDateLabel(selectedDate)}
          {selectedDate === todayKey ? " · Today" : ""}
        </div>

        {selectedRest && !isEditing ? (
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="text-lg font-semibold text-emerald-200/90">
                Rest Day
              </div>
              <div className="mt-1 text-sm text-white/50">
                Recovery logged for this date.
              </div>
              {selectedStretch &&
                getEntryDurationSeconds(selectedStretch) > 0 && (
                  <div className="mt-2 text-xs text-sky-200/90">
                    Stretch{" "}
                    {formatDurationSeconds(
                      getEntryDurationSeconds(selectedStretch)
                    )}
                    {selectedStretch.name ? ` · ${selectedStretch.name}` : ""}
                  </div>
                )}
            </div>
            <button
              onClick={() => setPendingDelete("session")}
              className="inline-flex items-center justify-center p-2 rounded-lg border border-white/10 bg-black/40 text-white/70 hover:text-red-300 hover:border-red-400/40 transition"
              aria-label="Delete rest day"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : selectedSession || isEditing ? (
          <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-white truncate">
                    {isEditing ? "Editing · " : ""}
                    {activeWorkout?.workoutType}
                  </div>
                  {activeWorkout?.routineName && (
                    <div className="mt-0.5 text-xs text-[#d7c7a4]/70 truncate">
                      {activeWorkout.routineName}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditableWorkout(structuredClone(selectedSession));
                        setPendingDelete(null);
                      }}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-[#c7a86a40] bg-black/40 text-[#d7c7a4] hover:bg-[#c7a86a22] transition"
                      aria-label="Edit workout"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setPendingDelete("session")}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-white/10 bg-black/40 text-white/70 hover:text-red-300 hover:border-red-400/40 transition"
                      aria-label="Delete workout"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-2 mb-4 text-sm">
                <div className="text-white/60 text-xs flex items-center gap-2">
                  Workout:
                  {isEditing ? (
                    <input
                      type="text"
                      value={activeWorkout.duration || ""}
                      onChange={(e) => {
                        const updated = structuredClone(editableWorkout);
                        updated.duration = e.target.value;
                        setEditableWorkout(updated);
                      }}
                      className="bg-white/10 text-white px-2 py-1 rounded w-20 border border-[#c7a86a33]"
                    />
                  ) : (
                    <span className="text-[#d7c7a4]">
                      {formatDurationSeconds(
                        getEntryDurationSeconds(activeWorkout)
                      ) ||
                        activeWorkout.duration ||
                        "-"}
                    </span>
                  )}
                </div>

                <div className="text-right text-white/60 text-xs">
                  {activeWorkout.type === "amrap" ||
                  Array.isArray(activeWorkout.circuit)
                    ? `Circuits: ${activeWorkout.circuitsCompleted ?? 0}`
                    : `Exercises: ${activeWorkout.exercises?.length || 0}`}
                </div>
              </div>

              {!isEditing && selectedStretch && (
                <div className="mb-4 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="uppercase tracking-[0.16em] text-sky-300/80 mb-0.5">
                        Stretch
                      </div>
                      <div className="truncate text-white/85">
                        {selectedStretch.name || "Stretch / Mobility"}
                      </div>
                    </div>
                    <div className="shrink-0 text-[#d7c7a4]">
                      {formatDurationSeconds(
                        getEntryDurationSeconds(selectedStretch)
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-white/55">
                    <span>Total</span>
                    <span className="text-[#d7c7a4]">
                      {formatDurationSeconds(
                        getEntryDurationSeconds(activeWorkout) +
                          getEntryDurationSeconds(selectedStretch)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {(activeWorkout.type === "amrap" ||
                Array.isArray(activeWorkout.circuit)) && (
                <div className="mb-4 space-y-3 text-sm text-white/80">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
                      Circuit
                    </div>
                    <div className="space-y-2">
                      {(activeWorkout.circuit || []).map((item, index) => (
                        <div
                          key={`amrap-circuit-${index}`}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 truncate font-medium text-white">
                            {item.name}
                          </div>
                          <div className="shrink-0 text-xs text-[#d7c7a4]">
                            {item.plannedWeight || "-"} ×{" "}
                            {item.targetReps || "-"}
                          </div>
                        </div>
                      ))}
                      {!(activeWorkout.circuit || []).length && (
                        <div className="text-xs text-white/40">
                          No circuit prescription saved.
                        </div>
                      )}
                    </div>
                  </div>

                  {activeWorkout.partialCircuit?.length > 0 && (
                    <div className="rounded-2xl border border-[#c7a86a40] bg-[#c7a86a12] p-4">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#d7c7a4]/80">
                        Partial circuit
                      </div>
                      <div className="space-y-2">
                        {activeWorkout.partialCircuit.map((item, index) => (
                          <div
                            key={`amrap-partial-${index}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 truncate font-medium text-white">
                              {item.name}
                            </div>
                            <div className="shrink-0 text-xs text-[#d7c7a4]">
                              {item.actualWeight || item.plannedWeight || "-"} ×{" "}
                              {item.actualReps || "0"}
                              {item.targetReps ? ` / ${item.targetReps}` : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 text-sm text-white/80">
                {!(
                  activeWorkout.type === "amrap" ||
                  Array.isArray(activeWorkout.circuit)
                ) &&
                  activeWorkout.exercises?.map((exercise, i) => {
                    const isExpanded = expandedExerciseIndex === i;

                    return (
                      <div
                        key={i}
                        className={`rounded-2xl p-4 transition-all duration-300 ease-out ${
                          isExpanded
                            ? "border border-[#c7a86a66] bg-[#c7a86a12]"
                            : "border border-white/10 bg-white/5"
                        }`}
                      >
                        <div
                          onClick={() =>
                            setExpandedExerciseIndex(isExpanded ? null : i)
                          }
                          className="flex justify-between items-center cursor-pointer py-1"
                        >
                          <div className="text-white font-medium min-w-0">
                            {isEditing ? (
                              <input
                                type="text"
                                value={exercise.name || ""}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const updated =
                                    structuredClone(editableWorkout);
                                  updated.exercises[i].name = e.target.value;
                                  setEditableWorkout(updated);
                                }}
                                className="bg-white/10 text-white px-2 py-1 rounded text-sm border border-[#c7a86a33] w-full max-w-[11rem]"
                              />
                            ) : (
                              exercise.name
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {isEditing && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated =
                                    structuredClone(editableWorkout);
                                  updated.exercises =
                                    updated.exercises.filter(
                                      (_, exIdx) => exIdx !== i
                                    );
                                  setEditableWorkout(updated);
                                }}
                                className="text-red-400"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}

                            {!isExpanded &&
                              exercise.sets.length > 0 &&
                              (() => {
                                const bestSet = exercise.sets.reduce(
                                  (best, current) => {
                                    const bestWeight = Number(
                                      best.actualWeight || 0
                                    );
                                    const bestReps = Number(
                                      best.actualReps || 0
                                    );
                                    const currWeight = Number(
                                      current.actualWeight || 0
                                    );
                                    const currReps = Number(
                                      current.actualReps || 0
                                    );

                                    if (
                                      currWeight > bestWeight ||
                                      (currWeight === bestWeight &&
                                        currReps > bestReps)
                                    ) {
                                      return current;
                                    }
                                    return best;
                                  },
                                  exercise.sets[0]
                                );

                                return (
                                  <div className="text-xs text-[#d7c7a4] font-medium">
                                    {bestSet.actualWeight || "-"} ×{" "}
                                    {bestSet.actualReps || "-"}
                                  </div>
                                );
                              })()}

                            <div className="text-white/50">
                              {isExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded
                              ? "max-h-96 opacity-100 mt-3"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="mt-1 space-y-2">
                            {exercise.sets?.map((set, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm bg-white/[0.04] px-4 py-2 rounded-xl border border-white/[0.05]"
                              >
                                <div className="text-[#d7c7a4]/80 text-xs tracking-wide">
                                  SET {idx + 1}
                                </div>

                                <div className="flex items-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <input
                                        type="number"
                                        value={set.actualWeight || ""}
                                        onChange={(e) => {
                                          const updated =
                                            structuredClone(editableWorkout);
                                          updated.exercises[i].sets[
                                            idx
                                          ].actualWeight = e.target.value;
                                          setEditableWorkout(updated);
                                        }}
                                        className="w-16 bg-white/10 text-white px-2 py-1 rounded text-sm border border-[#c7a86a33]"
                                      />
                                      <span className="text-white/70 text-xs">
                                        kg
                                      </span>
                                      <span className="text-white/50">×</span>
                                      <input
                                        type="number"
                                        value={set.actualReps || ""}
                                        onChange={(e) => {
                                          const updated =
                                            structuredClone(editableWorkout);
                                          updated.exercises[i].sets[
                                            idx
                                          ].actualReps = e.target.value;
                                          setEditableWorkout(updated);
                                        }}
                                        className="w-14 bg-white/10 text-white px-2 py-1 rounded text-sm border border-[#c7a86a33]"
                                      />
                                      <button
                                        onClick={() => {
                                          const updated =
                                            structuredClone(editableWorkout);
                                          updated.exercises[i].sets =
                                            updated.exercises[i].sets.filter(
                                              (_, sIdx) => sIdx !== idx
                                            );
                                          setEditableWorkout(updated);
                                        }}
                                        className="text-red-400 text-xs px-1"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  ) : (
                                    <div className="font-semibold text-white">
                                      {set.actualWeight || "-"} kg ×{" "}
                                      {set.actualReps || "-"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {isEditing && (
                              <button
                                onClick={() => {
                                  const updated =
                                    structuredClone(editableWorkout);
                                  updated.exercises[i].sets.push(
                                    createEmptySet()
                                  );
                                  setEditableWorkout(updated);
                                }}
                                className="text-xs text-[#d7c7a4] mt-2"
                              >
                                + Add Set
                              </button>
                            )}
                          </div>

                          {isEditing ? (
                            <textarea
                              value={exercise.remarks || ""}
                              onChange={(e) => {
                                const updated =
                                  structuredClone(editableWorkout);
                                updated.exercises[i].remarks = e.target.value;
                                setEditableWorkout(updated);
                              }}
                              placeholder="Exercise notes..."
                              rows={3}
                              className="w-full mt-3 rounded-xl border border-[#c7a86a40] bg-[#c7a86a12] p-3 text-sm text-white placeholder:text-white/30"
                            />
                          ) : (
                            exercise.remarks && (
                              <div className="mt-3 rounded-xl border border-[#c7a86a40] bg-[#c7a86a12] p-3">
                                <div className="text-[10px] uppercase tracking-[0.2em] text-[#d7c7a4]/80 mb-1">
                                  Notes
                                </div>
                                <div className="text-sm text-white/70 italic leading-relaxed">
                                  {exercise.remarks}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}

                {isEditing && (
                  <button
                    onClick={() => {
                      const updated = structuredClone(editableWorkout);
                      updated.exercises.push(createExercise());
                      setEditableWorkout(updated);
                    }}
                    className="text-sm text-[#d7c7a4] mt-2"
                  >
                    + Add Exercise
                  </button>
                )}

                {isEditing && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setWorkoutHistory(
                          upsertDaySession(workoutHistory, editableWorkout)
                        );
                        setIsEditing(false);
                        setEditableWorkout(null);
                      }}
                      className="w-full bg-[#c7a86a] text-black font-medium py-2.5 rounded-xl active:scale-[0.98] transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditableWorkout(null);
                      }}
                      className="w-full bg-white/10 text-white py-2.5 rounded-xl border border-white/10 active:scale-[0.98] transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
          </>
        ) : (
          <>
            <div className="mb-1 text-lg font-semibold text-white/85">
              {selectedStretch ? "No workout logged" : "Nothing logged"}
            </div>
            <div className="text-white/50 text-sm mb-4">
              {isFutureDate
                ? "Future dates stay empty until they arrive."
                : "Log a session, mark rest, or check off stretch."}
            </div>

            {!isFutureDate ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSelectedRoutine(null);
                    setSelectedDay(null);
                    setShowLogOptions(true);
                  }}
                  className="w-full bg-[#c7a86a] text-black font-medium py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  Log Workout
                </button>
                <button
                  onClick={() => {
                    if (selectedSession || selectedRest) return;
                    setWorkoutHistory(
                      upsertDaySession(
                        workoutHistory,
                        createRestEntry(selectedDate)
                      )
                    );
                  }}
                  className="w-full border border-emerald-400/35 bg-emerald-500/10 text-emerald-200 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  Rest Day
                </button>
              </div>
            ) : null}
          </>
        )}

        {/* Stretch / mobility quick check — can coexist with workout or rest */}
        {!isEditing && !isFutureDate && (
          <div
            className={`mt-4 rounded-xl border p-3 ${
              selectedStretch
                ? "border-sky-400/35 bg-sky-500/10"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-sky-300/80 mb-1">
                  Stretch / Mobility
                </div>
                <div className="text-sm text-white/80 truncate">
                  {selectedStretch
                    ? selectedStretch.name
                      ? `${selectedStretch.name} · done`
                      : "Done for this day"
                    : "Not logged yet"}
                </div>
                {selectedStretch &&
                  getEntryDurationSeconds(selectedStretch) > 0 && (
                    <div className="mt-1 text-xs text-sky-200/90">
                      {formatDurationSeconds(
                        getEntryDurationSeconds(selectedStretch)
                      )}
                    </div>
                  )}
              </div>

              {selectedStretch ? (
                <button
                  onClick={() => setPendingDelete("stretch")}
                  className="inline-flex items-center justify-center p-2 rounded-lg border border-white/10 bg-black/40 text-white/70 hover:text-red-300 hover:border-red-400/40 transition"
                  aria-label="Remove stretch"
                >
                  <Trash2 size={15} />
                </button>
              ) : (
                <button
                  onClick={markStretchDone}
                  className="shrink-0 rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-2 text-xs uppercase tracking-[0.14em] text-sky-200 active:scale-[0.98] transition"
                >
                  Mark done
                </button>
              )}
            </div>
          </div>
        )}

        {pendingDelete && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3">
            <div className="text-sm text-white/85 mb-3">
              {pendingDelete === "stretch"
                ? "Remove stretch for this day?"
                : "Delete this entry? Stretch for the day will be kept."}{" "}
              This can’t be undone.
            </div>
            <div className="flex gap-2">
              <button
                onClick={deletePendingEntry}
                className="flex-1 bg-red-500/80 text-white py-2 rounded-lg text-sm active:scale-[0.98] transition"
              >
                Delete
              </button>
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm border border-white/10 active:scale-[0.98] transition"
              >
                Keep
              </button>
            </div>
          </div>
        )}
      </div>

      {showLogOptions && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-black/80 border border-[#c7a86a55] rounded-2xl p-4 w-full max-w-sm shadow-xl shadow-black/50">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#d7c7a4]/70 mb-1">
              {selectedRoutine ? selectedRoutine.name : "Routines"}
            </div>
            <div className="text-white font-semibold mb-3">
              {selectedRoutine ? "Select day" : "Select workout"}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {!selectedRoutine ? (
                Object.values(routines || {}).map((routine, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedRoutine(routine)}
                    className="w-full text-left bg-white/5 hover:bg-[#c7a86a18] border border-white/10 hover:border-[#c7a86a55] p-3 rounded-xl text-white transition-all duration-200 active:scale-[0.98]"
                  >
                    {routine.name}
                  </button>
                ))
              ) : !selectedDay ? (
                selectedRoutine.days?.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const generatedWorkout = {
                        ...createWorkoutEntry({
                          date: selectedDate,
                          routineName: selectedRoutine.name,
                          workoutType: day.name,
                        }),
                        exercises: day.exercises.map((ex) => ({
                          name: ex.name,
                          sets: ex.sets.map(() => createEmptySet()),
                        })),
                      };

                      setEditableWorkout(generatedWorkout);
                      setIsEditing(true);
                      setShowLogOptions(false);
                      setSelectedRoutine(null);
                      setSelectedDay(null);
                      setExpandedExerciseIndex(0);
                    }}
                    className="w-full text-left bg-white/5 hover:bg-[#c7a86a18] border border-white/10 hover:border-[#c7a86a55] p-3 rounded-xl text-white transition-all duration-200 active:scale-[0.98]"
                  >
                    {day.name}
                  </button>
                ))
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between">
              {selectedRoutine ? (
                <button
                  onClick={() => setSelectedRoutine(null)}
                  className="text-sm text-[#d7c7a4] transition-all duration-200 active:scale-[0.98]"
                >
                  Back
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={() => {
                  setShowLogOptions(false);
                  setSelectedRoutine(null);
                  setSelectedDay(null);
                }}
                className="text-sm text-white/60 transition-all duration-200 active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
