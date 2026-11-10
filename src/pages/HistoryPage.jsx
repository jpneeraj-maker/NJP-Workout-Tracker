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
  createAmrapHistoryEntry,
  createEmptySet,
  createExercise,
  createRestEntry,
  createStretchEntry,
  createWorkoutEntry,
  formatDurationSeconds,
  formatHistorySessionTitle,
  getEntryDurationSeconds,
  getLocalSaveKey,
  groupHistoryByDate,
  isAmrapDay,
  isRestEntry,
  isSessionEntry,
  isStretchEntry,
  loadStretchRoutineNames,
  parseDurationToSeconds,
  rememberStretchRoutineName,
  sanitizeAmrapPartials,
  upsertDaySession,
  upsertDayStretch,
} from "../schema";
import FittingText from "../components/FittingText";

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
  return getLocalSaveKey();
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
  const [selectedRoutineKey, setSelectedRoutineKey] = React.useState(null);
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
  const [showStretchForm, setShowStretchForm] = React.useState(false);
  const [stretchName, setStretchName] = React.useState("");
  const [stretchDuration, setStretchDuration] = React.useState("");
  const [stretchNames, setStretchNames] = React.useState(() =>
    loadStretchRoutineNames()
  );

  const isAmrapWorkout = (workout) =>
    workout?.type === "amrap" || Array.isArray(workout?.circuit);

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
    setShowStretchForm(false);
    setStretchName("");
    setStretchDuration("");
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

    const stretchTarget = selectedStretch;
    const sessionTarget = selectedSession || selectedRest;

    setWorkoutHistory((prev) =>
      (prev || []).filter((w) => {
        if (pendingDelete === "stretch") {
          if (!isStretchEntry(w)) return true;
          if (stretchTarget?.id && w.id) return w.id !== stretchTarget.id;
          return String(w.saveKey) !== String(selectedDate);
        }

        // Delete workout or rest for this day; keep stretch.
        if (isStretchEntry(w)) return true;

        if (sessionTarget?.id && w.id) {
          return w.id !== sessionTarget.id;
        }

        const key = String(w.saveKey || "");
        if (key === String(selectedDate)) return false;
        if (sessionTarget?.saveKey && key === String(sessionTarget.saveKey)) {
          return false;
        }

        // Fallback: drop the exact displayed object fields for older entries without id.
        if (
          sessionTarget &&
          key === String(sessionTarget.saveKey || selectedDate) &&
          (isSessionEntry(w) || isRestEntry(w)) &&
          (w.workoutType || "") === (sessionTarget.workoutType || "") &&
          (w.duration || "") === (sessionTarget.duration || "") &&
          (w.createdAt || null) === (sessionTarget.createdAt || null)
        ) {
          return false;
        }

        return true;
      })
    );

    setPendingDelete(null);
    setIsEditing(false);
    setEditableWorkout(null);
  };

  const openStretchForm = () => {
    if (!selectedDate || isFutureDate || selectedStretch) return;
    setStretchName("");
    setStretchDuration("");
    setShowStretchForm(true);
    setPendingDelete(null);
  };

  const saveStretchFromForm = () => {
    if (!selectedDate || isFutureDate || selectedStretch) return;

    const name = stretchName.trim() || "Stretch / Mobility";
    const seconds = parseDurationToSeconds(stretchDuration);
    const nextNames = rememberStretchRoutineName(name, stretchNames);
    const stretchEntry = createStretchEntry(selectedDate, {
      name,
      duration: formatDurationSeconds(seconds),
      durationSeconds: seconds,
    });

    setStretchNames(nextNames);
    setWorkoutHistory(upsertDayStretch(workoutHistory, stretchEntry));
    setShowStretchForm(false);
    setStretchName("");
    setStretchDuration("");
  };

  const saveEditableWorkout = () => {
    if (!editableWorkout) return;

    let next = structuredClone(editableWorkout);
    const seconds = getEntryDurationSeconds(next);
    next.durationSeconds = seconds;
    next.duration = formatDurationSeconds(seconds) || next.duration || "";

    if (isAmrapWorkout(next)) {
      next.type = "amrap";
      next.circuitsCompleted = Number(next.circuitsCompleted) || 0;
      next.partialCircuit = sanitizeAmrapPartials(next.partialCircuit);
      next.exercises = [];
    }

    setWorkoutHistory(upsertDaySession(workoutHistory, next));
    setIsEditing(false);
    setEditableWorkout(null);
  };

  const panelBorder = selectedRest
    ? "border-emerald-500/25"
    : "border-violet-400/35";

  return (
    <>
      <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2 pt-3">
        <button
          onClick={() => {
            window.history.pushState({}, "");
            setActiveScreen("landing");
          }}
          className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/35 backdrop-blur-sm text-violet-200 border border-violet-400/45 hover:bg-black/50 active:scale-[0.97] transition"
        >
          <ArrowLeft size={14} />
        </button>

        <div className="min-w-0 text-center">
          <div className="text-lg font-semibold text-white sm:text-xl">
            Workout History
          </div>
          <div className="mx-auto mt-1 h-0.5 w-10 rounded-full bg-violet-400/70" />
        </div>

        <button
          onClick={() => {
            if (typeof setActiveTab === "function") {
              setActiveTab("analytics");
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-black/35 backdrop-blur-sm text-emerald-200 border border-emerald-400/45 hover:bg-black/50 active:scale-[0.97] transition"
          title="Analytics"
        >
          <ChartNoAxesCombined size={16} />
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-2 mb-3 text-white/80">
        <button
          className="p-2 rounded-lg border border-violet-400/25 bg-black/20 text-violet-200 active:scale-95 transition"
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
        <div className="text-sm font-medium text-violet-100 bg-black/30 border border-violet-400/40 px-4 py-1.5 rounded-lg min-w-[9.5rem] text-center">
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <button
          className="p-2 rounded-lg border border-violet-400/25 bg-black/20 text-violet-200 active:scale-95 transition"
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
        <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-violet-400/35 bg-violet-500/5 backdrop-blur-md px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-violet-100/90">
          <span>
            <span className="font-semibold text-white">{monthStats.workouts}</span>{" "}
            <span className="text-violet-200/80">workouts</span>
          </span>
          <span className="text-violet-400/50">·</span>
          <span>
            <span className="font-semibold text-emerald-300">{monthStats.rest}</span>{" "}
            <span className="text-violet-200/80">rest</span>
          </span>
          <span className="text-violet-400/50">·</span>
          <span>
            <span className="font-semibold text-sky-300">{monthStats.stretch}</span>{" "}
            <span className="text-violet-200/80">stretch</span>
          </span>
          <span className="text-violet-400/50">·</span>
          <span>
            <span className="font-semibold text-white">
              {monthStats.workoutStreak}
            </span>{" "}
            <span className="text-violet-200/80">w streak</span>
          </span>
          <span className="text-violet-400/50">·</span>
          <span>
            <span className="font-semibold text-sky-300">
              {monthStats.stretchStreak}
            </span>{" "}
            <span className="text-violet-200/80">s streak</span>
          </span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-black/40 backdrop-blur-md border border-violet-400/40 rounded-2xl p-3 shadow-lg shadow-violet-950/20 mb-4 sm:p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-violet-200/70 sm:gap-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-white/80 sm:gap-2">
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
                      ? "bg-violet-500/25 border border-violet-400 shadow-md shadow-violet-950/40 scale-105"
                      : hasSession
                        ? "bg-violet-500/15 border border-violet-400/35 hover:bg-violet-500/20"
                        : isRest
                          ? "bg-emerald-500/15 border border-emerald-400/30 hover:bg-emerald-500/25"
                          : hasStretch
                            ? "bg-sky-500/10 border border-sky-400/25 hover:bg-sky-500/20"
                            : "bg-black/40 border border-transparent hover:bg-white/10"
                  }
                  ${isToday && !isSelected ? "ring-1 ring-violet-400/50" : ""}
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
                          isRest ? "bg-emerald-400" : "bg-violet-400"
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
            <span className="w-2 h-2 rounded-full bg-violet-400" />
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
        <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-violet-200/70">
          {formatDateLabel(selectedDate)}
          {selectedDate === todayKey ? " · Today" : ""}
        </div>

        {pendingDelete && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3">
            <div className="text-sm text-white/85 mb-3">
              {pendingDelete === "stretch"
                ? "Remove stretch for this day?"
                : "Delete this entry? Stretch for the day will be kept."}{" "}
              This can’t be undone.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={deletePendingEntry}
                className="flex-1 bg-red-500/80 text-white py-2 rounded-lg text-sm active:scale-[0.98] transition"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm border border-white/10 active:scale-[0.98] transition"
              >
                Keep
              </button>
            </div>
          </div>
        )}

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
                <div className="min-w-0 flex-1">
                  <FittingText
                    text={`${isEditing ? "Editing · " : ""}${formatHistorySessionTitle(
                      activeWorkout,
                      routines
                    )}`}
                    className="font-semibold text-white"
                    maxSize={18}
                    minSize={12}
                    maxLines={2}
                  />
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

              {isEditing ? (
                <div className="grid grid-cols-2 gap-y-2 mb-4 text-sm">
                  <div className="text-white/60 text-xs flex items-center gap-2">
                    Duration:
                    <input
                      type="text"
                      value={activeWorkout.duration || ""}
                      onChange={(e) => {
                        const updated = structuredClone(editableWorkout);
                        updated.duration = e.target.value;
                        updated.durationSeconds = parseDurationToSeconds(
                          e.target.value
                        );
                        setEditableWorkout(updated);
                      }}
                      placeholder="mm:ss"
                      className="bg-white/10 text-white px-2 py-1 rounded w-24 border border-[#c7a86a33]"
                    />
                  </div>

                  <div className="text-right text-white/60 text-xs flex items-center justify-end gap-2">
                    {isAmrapWorkout(activeWorkout) ? (
                      <>
                        Circuits:
                        <input
                          type="number"
                          min="0"
                          value={activeWorkout.circuitsCompleted ?? 0}
                          onChange={(e) => {
                            const updated = structuredClone(editableWorkout);
                            updated.circuitsCompleted =
                              Number(e.target.value) || 0;
                            setEditableWorkout(updated);
                          }}
                          className="bg-white/10 text-white px-2 py-1 rounded w-16 border border-[#c7a86a33] text-right"
                        />
                      </>
                    ) : (
                      `Exercises: ${activeWorkout.exercises?.length || 0}`
                    )}
                  </div>
                </div>
              ) : selectedStretch ? (
                <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold tabular-nums text-[#d7c7a4]">
                        {formatDurationSeconds(
                          getEntryDurationSeconds(activeWorkout)
                        ) ||
                          activeWorkout.duration ||
                          "-"}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
                        Workout
                      </div>
                      <div className="mt-0.5 break-words text-[11px] text-white/40">
                        {isAmrapWorkout(activeWorkout)
                          ? `${activeWorkout.circuitsCompleted ?? 0} circuits`
                          : `${activeWorkout.exercises?.length || 0} exercises`}
                      </div>
                    </div>

                    <div className="min-w-0 border-x border-white/10 px-1">
                      <div className="text-lg font-semibold tabular-nums text-sky-300">
                        {formatDurationSeconds(
                          getEntryDurationSeconds(selectedStretch)
                        ) || "-"}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-sky-300/70">
                        Stretch
                      </div>
                      <div className="mt-0.5 break-words text-[11px] text-sky-200/55">
                        {selectedStretch.name || "Mobility"}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xl font-semibold tabular-nums text-white">
                        {formatDurationSeconds(
                          getEntryDurationSeconds(activeWorkout) +
                            getEntryDurationSeconds(selectedStretch)
                        )}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/55">
                        Total
                      </div>
                      <div className="mt-0.5 text-[11px] text-white/35">
                        session
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-2 mb-4 text-sm">
                  <div className="text-white/60 text-xs flex items-center gap-2">
                    Duration:
                    <span className="text-[#d7c7a4]">
                      {formatDurationSeconds(
                        getEntryDurationSeconds(activeWorkout)
                      ) ||
                        activeWorkout.duration ||
                        "-"}
                    </span>
                  </div>

                  <div className="text-right text-white/60 text-xs flex items-center justify-end gap-2">
                    {isAmrapWorkout(activeWorkout) ? (
                      <>
                        Circuits:
                        <span className="text-[#d7c7a4]">
                          {activeWorkout.circuitsCompleted ?? 0}
                        </span>
                      </>
                    ) : (
                      `Exercises: ${activeWorkout.exercises?.length || 0}`
                    )}
                  </div>
                </div>
              )}

              {isAmrapWorkout(activeWorkout) && (
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
                          <div className="min-w-0 break-words font-medium text-white">
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

                  {(() => {
                    const loggedPartials = sanitizeAmrapPartials(
                      activeWorkout.partialCircuit
                    );
                    const editingPartials =
                      isEditing &&
                      (activeWorkout.partialCircuit || []).length > 0;
                    const showPartialSection =
                      loggedPartials.length > 0 || editingPartials;

                    if (!showPartialSection) {
                      if (!isEditing || !(activeWorkout.circuit || []).length) {
                        return null;
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = structuredClone(editableWorkout);
                            updated.partialCircuit = (
                              updated.circuit || []
                            ).map((circuitItem) => ({
                              ...circuitItem,
                              actualWeight: "",
                              actualReps: "",
                            }));
                            setEditableWorkout(updated);
                          }}
                          className="text-sm text-[#d7c7a4]"
                        >
                          + Add incomplete circuit
                        </button>
                      );
                    }

                    const rows = isEditing
                      ? activeWorkout.partialCircuit?.length
                        ? activeWorkout.partialCircuit
                        : (activeWorkout.circuit || []).map((item) => ({
                            ...item,
                            actualWeight: "",
                            actualReps: "",
                          }))
                      : loggedPartials;

                    return (
                    <div className="rounded-2xl border border-[#c7a86a40] bg-[#c7a86a12] p-4">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#d7c7a4]/80">
                        Partial / incomplete circuit
                      </div>
                      {isEditing && (
                        <div className="mb-3 text-xs text-white/45">
                          Enter what you finished in the last incomplete round.
                          Leave blank if none.
                        </div>
                      )}
                      <div className="space-y-3">
                        {rows.map((item, index) => (
                          <div
                            key={`amrap-partial-${index}`}
                            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                          >
                            <div className="mb-2 min-w-0 break-words font-medium text-white">
                              {item.name}
                            </div>
                            {isEditing ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={item.actualWeight || ""}
                                  onChange={(e) => {
                                    const updated =
                                      structuredClone(editableWorkout);
                                    if (!updated.partialCircuit?.length) {
                                      updated.partialCircuit = (
                                        updated.circuit || []
                                      ).map((circuitItem) => ({
                                        ...circuitItem,
                                        actualWeight:
                                          circuitItem.plannedWeight || "",
                                        actualReps: "",
                                      }));
                                    }
                                    updated.partialCircuit[index].actualWeight =
                                      e.target.value;
                                    setEditableWorkout(updated);
                                  }}
                                  placeholder="weight"
                                  className="w-20 bg-white/10 text-white px-2 py-1 rounded text-sm border border-[#c7a86a33]"
                                />
                                <span className="text-white/50">×</span>
                                <input
                                  type="number"
                                  value={item.actualReps || ""}
                                  onChange={(e) => {
                                    const updated =
                                      structuredClone(editableWorkout);
                                    if (!updated.partialCircuit?.length) {
                                      updated.partialCircuit = (
                                        updated.circuit || []
                                      ).map((circuitItem) => ({
                                        ...circuitItem,
                                        actualWeight:
                                          circuitItem.plannedWeight || "",
                                        actualReps: "",
                                      }));
                                    }
                                    updated.partialCircuit[index].actualReps =
                                      e.target.value;
                                    setEditableWorkout(updated);
                                  }}
                                  placeholder="reps"
                                  className="w-16 bg-white/10 text-white px-2 py-1 rounded text-sm border border-[#c7a86a33]"
                                />
                                {item.targetReps ? (
                                  <span className="text-xs text-white/40">
                                    / {item.targetReps}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <div className="text-xs text-[#d7c7a4]">
                                {item.actualWeight || item.plannedWeight || "-"}{" "}
                                × {item.actualReps || "0"}
                                {item.targetReps
                                  ? ` / ${item.targetReps}`
                                  : ""}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-3 text-sm text-white/80">
                {!isAmrapWorkout(activeWorkout) &&
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

                {isEditing && !isAmrapWorkout(activeWorkout) && (
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
                      onClick={saveEditableWorkout}
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

        {/* Stretch / mobility — can coexist with workout or rest */}
        {!isEditing && !isFutureDate && (
          <div
            className={`mt-4 rounded-xl border p-3 ${
              selectedStretch || showStretchForm
                ? "border-sky-400/35 bg-sky-500/10"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-sky-300/80 mb-1">
                  Stretch / Mobility
                </div>
                {!showStretchForm && (
                  <>
                    <div className="text-sm text-white/80 break-words">
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
                  </>
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
              ) : !showStretchForm ? (
                <button
                  onClick={openStretchForm}
                  className="shrink-0 rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-2 text-xs uppercase tracking-[0.14em] text-sky-200 active:scale-[0.98] transition"
                >
                  Log stretch
                </button>
              ) : null}
            </div>

            {showStretchForm && !selectedStretch && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-[0.16em] text-sky-300/80">
                    Routine name
                  </label>
                  <input
                    type="text"
                    value={stretchName}
                    onChange={(e) => setStretchName(e.target.value)}
                    placeholder="e.g. Hip mobility"
                    className="w-full rounded-lg border border-sky-400/30 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
                  />
                  {stretchNames.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {stretchNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setStretchName(name)}
                          className={`rounded-lg border px-2 py-1 text-xs transition ${
                            stretchName === name
                              ? "border-sky-300 bg-sky-500/25 text-sky-100"
                              : "border-white/10 bg-white/5 text-white/70"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-[0.16em] text-sky-300/80">
                    Duration (mm:ss)
                  </label>
                  <input
                    type="text"
                    value={stretchDuration}
                    onChange={(e) => setStretchDuration(e.target.value)}
                    placeholder="10:00"
                    className="w-full rounded-lg border border-sky-400/30 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveStretchFromForm}
                    className="flex-1 rounded-lg bg-sky-400 text-black font-medium py-2 text-sm active:scale-[0.98] transition"
                  >
                    Save stretch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStretchForm(false);
                      setStretchName("");
                      setStretchDuration("");
                    }}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 text-white/70 py-2 text-sm active:scale-[0.98] transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
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
                Object.entries(routines || {}).map(([key, routine]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedRoutine(routine);
                      setSelectedRoutineKey(key);
                    }}
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
                      const generatedWorkout = isAmrapDay(day)
                        ? {
                            ...createAmrapHistoryEntry({
                              date: selectedDate,
                              routineName: selectedRoutine.name,
                              day,
                            }),
                            week: selectedRoutineKey,
                          }
                        : {
                            ...createWorkoutEntry({
                              date: selectedDate,
                              routineName: selectedRoutine.name,
                              workoutType: day.name,
                            }),
                            week: selectedRoutineKey,
                            exercises: (day.exercises || []).map((ex) => ({
                              name: ex.name,
                              sets: (ex.sets || []).map(() => createEmptySet()),
                            })),
                          };

                      setEditableWorkout(generatedWorkout);
                      setIsEditing(true);
                      setShowLogOptions(false);
                      setSelectedRoutine(null);
                      setSelectedRoutineKey(null);
                      setSelectedDay(null);
                      setExpandedExerciseIndex(
                        isAmrapDay(day) ? null : 0
                      );
                    }}
                    className="w-full text-left bg-white/5 hover:bg-[#c7a86a18] border border-white/10 hover:border-[#c7a86a55] p-3 rounded-xl text-white transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{day.name}</span>
                      {isAmrapDay(day) && (
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[#d7c7a4]/80">
                          AMRAP
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between">
              {selectedRoutine ? (
                <button
                  onClick={() => {
                    setSelectedRoutine(null);
                    setSelectedRoutineKey(null);
                  }}
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
                  setSelectedRoutineKey(null);
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
