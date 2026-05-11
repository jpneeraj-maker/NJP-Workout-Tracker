import React from "react";
import { Trash2 } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import {
  createEmptySet,
  createExercise,
  createRestEntry,
  createWorkoutEntry
} from "../schema";
export default function HistoryPage(props) {
  const {
  workoutHistory,
  setWorkoutHistory,
  setActiveScreen,
  routines
} = props;
console.log("ROUTINES DATA:", routines);
const [selectedRoutine, setSelectedRoutine] = React.useState(null);
const [selectedDay, setSelectedDay] = React.useState(null);
const [tempWorkout, setTempWorkout] = React.useState(null);
const [expandedExerciseIndex, setExpandedExerciseIndex] = React.useState(null);
const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const [selectedDate, setSelectedDate] = React.useState(null);
const today = new Date();
const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
const [currentYear, setCurrentYear] = React.useState(today.getFullYear());

const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
const firstDay = new Date(currentYear, currentMonth, 1).getDay();
// Convert Sunday-first → Monday-first layout
const startOffset = firstDay === 0 ? 6 : firstDay - 1;
const [showLogOptions, setShowLogOptions] = React.useState(false);
const historyByDate = {};
workoutHistory.forEach((w) => {
  historyByDate[w.saveKey] = w;
});

const [isEditing, setIsEditing] = React.useState(false);
const [editableWorkout, setEditableWorkout] = React.useState(null);

React.useEffect(() => {
  const today = new Date();

  setSelectedDate(getTodayKey());
}, []);

const selectedWorkout = selectedDate
  ? historyByDate[selectedDate]
  : null;

  const activeWorkout = isEditing ? editableWorkout : selectedWorkout;
  const todayKey = getTodayKey();
  const isFutureDate =
  selectedDate && selectedDate > todayKey;

  return (
    <>
    <div className="mb-3 relative flex items-center justify-center">
      {/* Back Button */}
      <div className="absolute left-0 transition-all duration-200 active:scale-[0.98]">
        <button
          onClick={() => {
            window.history.pushState({}, "");
            setActiveScreen("landing");
          }}
         className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-md text-white text-base border border-white/10 hover:bg-black/70 active:scale-[0.97] transition"
        >
        <ArrowLeft size={14} />
        </button>
        </div>

      {/* Header */}
      <div className="text-center">
        <div className="text-xl font-semibold text-white">
          Workout History
        </div>
      </div>
</div>

      {/* Month Selector */}
      <div className="flex items-center justify-center mb-4 text-white/80 transition-all duration-200 active:scale-[0.98]">
        <button
          className="px-3"
          onClick={() => {
              if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear((prev) => prev - 1);
                } else {
                        setCurrentMonth((prev) => prev - 1);
                      }
                 }}
                  >
                ←
        </button>
        <div className="text-sm font-semibold text-white bg-black/30 px-3 py-1 rounded-lg">
          {new Date(currentYear, currentMonth).toLocaleString("default", {
           month: "long",
           year: "numeric",
          })}
        </div>
        <button
  className="px-3"
  onClick={() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  }}
>
  →
</button>
      </div>

      {/* Calendar Grid (STATIC for now) */}
<div className="bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-4 shadow-lg shadow-black/40 mb-4">

  {/* Weekdays */}
  <div className="grid grid-cols-7 gap-2 text-center text-xs text-white/90 mb-2">
    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
      <div key={i}>{d}</div>
    ))}
  </div>

  {/* Dates */}
  <div className="grid grid-cols-7 gap-2 text-center text-xs text-white/80 ">
    {[
  ...Array(startOffset).fill(null),
  ...Array(daysInMonth).keys(),
].map((day, i) => {
  if (day === null) {
    return <div key={i}></div>;
  }

  const date = day + 1;

  const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

  const workout = historyByDate[dateKey];


let dotColor = null;

if (workout) {
  if (workout.type === "rest") {
    dotColor = "bg-green-500";
  } else {
    dotColor = "bg-purple-500";
  }
}

const isSelected = selectedDate === dateKey;
const isToday = dateKey === todayKey;
const isFuture = dateKey > todayKey;

  return (
    <div
      key={i}
onClick={() => {
  if (isFuture) return;

  setSelectedDate(dateKey);
}}
className={`h-10 flex flex-col items-center justify-center rounded-lg cursor-pointer
  transition-all duration-200 ease-out active:scale-95

  ${
    isFuture
      ? "opacity-30 pointer-events-none"
      : ""
  }

  ${
    isSelected
      ? "bg-yellow-500/20 border border-yellow-400 shadow-md shadow-yellow-500/30 scale-105"
      : "bg-black/40 backdrop-blur-sm hover:scale-105 hover:bg-white/10"
  }

  ${
  isToday
    ? "ring-1 ring-yellow-300/40"
    : ""
}
  )}}
`}>
      <div className="text-white font-medium">
  {date}
</div>

      {dotColor && (
        <div className={`w-2 h-2 rounded-full mt-1 ${dotColor}`} />
      )}
    </div>
  );
})}
</div>
      </div>

      {/* Selected Workout Panel */}
      <div className="mt-6 bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-4 shadow-lg shadow-black/40">
{selectedWorkout ? (
 !isEditing && selectedWorkout.type === "rest" ? (

  <>
    <div className="flex items-center justify-end mb-3">

      <button
        onClick={() => {
          const confirmed = window.confirm(
            "Delete this entry?"
          );

          if (!confirmed) return;

          const updatedHistory = workoutHistory.filter(
            (w) => w.saveKey !== selectedDate
          );

          setWorkoutHistory(updatedHistory);
        }}
        className="text-sm px-1 py-1 rounded-full bg-black/60"
      >
        <Trash2 size={16} />
      </button>

    </div>

    <div className="text-center text-white/70 text-sm py-6">
      Rest Day
    </div>
  </>

) : (
          <>
<div className="flex items-center mb-3">

  {/* Center Title */}
  <div className="flex-1 text-center text-white text-lg font-semibold">
    {isEditing ? "Editing: " : ""}
    {activeWorkout.workoutType}
  </div>

  <div className="flex items-center gap-3">
      {/* Edit Button */}
  {!isEditing && selectedWorkout.type !== "rest" && (
    <button
      onClick={() => {
        setIsEditing(true);
        setEditableWorkout(structuredClone(selectedWorkout));
      }}
      className="text-sm px-2 py-1 rounded-full bg-black/0"
    >
      ✎
    </button>
  )}
 {/* Delete */}
  {!isEditing && (
    <button
      onClick={() => {
        const confirmed = window.confirm(
          "Delete this entry?"
        );

        if (!confirmed) return;

        const updatedHistory = workoutHistory.filter(
          (w) => w.saveKey !== selectedDate
        );

        setWorkoutHistory(updatedHistory);
      }}
      className="text-sm px-1 py-1 rounded-full bg-black/60"
    >
      <Trash2 size={16} />
    </button>
  )}
  </div>

</div>

<div className="grid grid-cols-2 gap-y-2 mb-4 text-sm">

  {/* Row 2 */}
  <div className="text-white/60 text-xs flex items-center gap-2">
  Duration:

  {isEditing ? (
    <input
      type="text"
      value={activeWorkout.duration || ""}
      onChange={(e) => {
        const updated = structuredClone(editableWorkout);
        updated.duration = e.target.value;
        setEditableWorkout(updated);
      }}
      className="bg-white/10 text-white px-2 py-1 rounded w-20"
    />
  ) : (
    <span>{activeWorkout.duration || "-"}</span>
  )}
</div>

  <div className="text-right text-white/60 text-xs">
    Exercises: {activeWorkout.exercises?.length || 0}
  </div>

</div>
            {/* Exercises */}
            <div className="space-y-3 text-sm text-white/80">
             {activeWorkout.exercises?.map((exercise, i) => {
  const isExpanded = expandedExerciseIndex === i;

  return (
    <div
  key={i}
className={`rounded-2xl p-4 transition-all duration-300 ease-out
  ${
    isExpanded
      ? "border border-purple-400 bg-purple-400/10 shadow-lg shadow-purple-500/30 scale-[1.01]"
      : "border border-white/10 bg-white/5"
  }
`}
>
      {/* Exercise Header */}
 <div
  onClick={() =>
    setExpandedExerciseIndex(isExpanded ? null : i)
  }
  className="flex justify-between items-center cursor-pointer py-1"
>
  {/* Left: Exercise Name */}
  <div className="text-white font-medium">

  {isEditing ? (
    <input
      type="text"
      value={exercise.name || ""}
      onChange={(e) => {
        const updated = structuredClone(editableWorkout);
        updated.exercises[i].name = e.target.value;
        setEditableWorkout(updated);
      }}
      className="bg-white/10 text-white px-2 py-1 rounded text-sm"
    />
  ) : (
    exercise.name
  )}

</div>

  {/* Right: Summary + Arrow */}
  <div className="flex items-center gap-3">
    {isEditing && (
  <button
    onClick={() => {
      const updated = structuredClone(editableWorkout);

      updated.exercises = updated.exercises.filter(
        (_, exIdx) => exIdx !== i
      );

      setEditableWorkout(updated);
    }}
    className="text-red-400 text-xs"
  >
    <Trash2 size={16} />
  </button>
)}

  {!isExpanded && exercise.sets.length > 0 && (() => {
  const bestSet = exercise.sets.reduce((best, current) => {
    const bestWeight = Number(best.actualWeight || 0);
    const bestReps = Number(best.actualReps || 0);

    const currWeight = Number(current.actualWeight || 0);
    const currReps = Number(current.actualReps || 0);

    if (
      currWeight > bestWeight ||
      (currWeight === bestWeight && currReps > bestReps)
    ) {
      return current;
    }
    return best;
  }, exercise.sets[0]);

  return (
    <div className="text-xs text-purple-300 font-medium">
      {bestSet.actualWeight || "-"} × {bestSet.actualReps || "-"}
    </div>
  );
})()}
    {/* Arrow */}
    <div className="text-white/50 text-xs">
      {isExpanded ? "▲" : "▼"}
    </div>

  </div>
</div>

      {/* Expanded Sets */}
      <div
  className={`overflow-hidden transition-all duration-300 ease-in-out ${
    isExpanded ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
  }`}
>
        <div className="mt-3 space-y-2">
          {exercise.sets?.map((set, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center text-sm bg-white/[0.04] px-4 py-2 rounded-xl border border-white/[0.05]"
            >
              <div className="text-purple-300 text-xs">
                SET {idx + 1}
              </div>

<div className="flex items-center gap-2">

  {isEditing ? (
    <>
      <input
        type="number"
        value={set.actualWeight || ""}
        onChange={(e) => {
          const updated = structuredClone(editableWorkout);
          updated.exercises[i].sets[idx].actualWeight = e.target.value;
          setEditableWorkout(updated);
        }}
        className="w-16 bg-white/10 text-white px-2 py-1 rounded text-sm"
      />

      <span className="text-white/70 text-xs">kg</span>
      <span className="text-white/50">×</span>

      <input
        type="number"
        value={set.actualReps || ""}
        onChange={(e) => {
          const updated = structuredClone(editableWorkout);
          updated.exercises[i].sets[idx].actualReps = e.target.value;
          setEditableWorkout(updated);
        }}
        className="w-14 bg-white/10 text-white px-2 py-1 rounded text-sm"
      />

      {/* ✅ Delete button INSIDE same block */}
      <button
        onClick={() => {
          const updated = structuredClone(editableWorkout);

          updated.exercises[i].sets = updated.exercises[i].sets.filter(
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
      {set.actualWeight || "-"} kg × {set.actualReps || "-"}
    </div>
  )}

</div>
            </div>
          ))}
          {isEditing && (
  <button
    onClick={() => {
      const updated = structuredClone(editableWorkout);

      updated.exercises[i].sets.push(
        createEmptySet());
      setEditableWorkout(updated);
    }}
    className="text-xs text-green-400 mt-2"
  >
    + Add Set
  </button>
)}
        </div>
              {/* Exercise Remarks */}
{isEditing ? (
  <textarea
    value={exercise.remarks || ""}
    onChange={(e) => {
      const updated = structuredClone(editableWorkout);

      updated.exercises[i].remarks = e.target.value;

      setEditableWorkout(updated);
    }}
    placeholder="Exercise notes..."
    rows={3}
    className="w-full mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm text-white placeholder:text-white/30"
  />
) : (
  exercise.remarks && (
    <div className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">

      <div className="text-[10px] uppercase tracking-[0.2em] text-yellow-300/70 mb-1">
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

      updated.exercises.push(
       createExercise()
      );

      setEditableWorkout(updated);
    }}
    className="text-sm text-green-400 mt-2"
  >
    + Add Exercise
  </button>
)}
{isEditing && (
  <div className="flex gap-2 mt-4">
    
    {/* Save */}
    <button
      onClick={() => {
        const filteredHistory = workoutHistory.filter(
          (w) => w.saveKey !== selectedDate
        );

        const updatedHistory = [editableWorkout, ...filteredHistory];

        setWorkoutHistory(updatedHistory);
        setIsEditing(false);
        setEditableWorkout(null);
      }}
      className="w-full bg-green-600 text-white py-2 rounded-xl"
    >
      Save
    </button>

    {/* Cancel */}
    <button
      onClick={() => {
        setIsEditing(false);
        setEditableWorkout(null);
      }}
      className="w-full bg-white/10 text-white py-2 rounded-xl"
    >
      Cancel
    </button>

  </div>
)}
            </div>
          </>
        )
) : (

          <>
            <div className="text-white/60 text-sm mb-4">
              No workout done on this day.
            </div>

          {!isFutureDate ? (
  <div className="flex gap-2">
  <button
    onClick={() => {
      setSelectedRoutine(null);
      setSelectedDay(null);
      setShowLogOptions(true);
    }}
    className="w-full bg-purple-600 text-white py-2 rounded-xl transition-all duration-200 active:scale-[0.98]"
  >
    Log Workout
  </button>

  <button
    onClick={() => {
      if (selectedWorkout) return; // Step 3 will handle overwrite

      const restEntry = createRestEntry(selectedDate);
      ;

  const updatedHistory = [restEntry, ...workoutHistory];

  setWorkoutHistory(updatedHistory);
}}
    className="w-full bg-green-600 text-white py-2 rounded-xl transition-all duration-200 active:scale-[0.98]"
  >
    Rest Day
</button>
</div>
) : (
  <div className="text-white/40 text-sm">
    Cannot log future workouts.
  </div>
)}
          </>
        )}
      </div>
{showLogOptions && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div className="bg-zinc-900 rounded-2xl p-4 w-80">
      <div className="text-white font-semibold mb-3">
        Select Workout
      </div>

<div className="space-y-2">
  {!selectedRoutine ? (
    Object.values(routines || {}).map((routine, i) => (
      <button
        key={i}
        onClick={() => setSelectedRoutine(routine)}
        className="w-full text-left bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white transition-all duration-200 active:scale-[0.98]"
      >
        {routine.name}
      </button>
    ))
  ) : !selectedDay ? (
    selectedRoutine.days?.map((day, i) => (
      <button
        key={i}
        onClick={() => {
  setSelectedDay(day);

const generatedWorkout = {
  ...createWorkoutEntry({
    date: selectedDate,
    routineName: selectedRoutine.name,
    workoutType: day.name
  }),

  exercises: day.exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets.map(() => (
       createEmptySet()
    ))
  }))
};

  setTempWorkout(generatedWorkout);
}}
        className="w-full text-left bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white transition-all duration-200 active:scale-[0.98]"
      >
        {day.name}
      </button>
    ))
  ) : (
    <div className="space-y-3">
  {tempWorkout?.exercises?.map((exercise, i) => (
    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2">
      
      <div className="text-white text-sm mb-2">
        {exercise.name}
      </div>

      <div className="space-y-2">
        {exercise.sets?.map((set, idx) => (
          <div key={idx} className="flex gap-2">
            
            <input
  type="number"
  placeholder="kg"
  value={set.actualWeight}
  onChange={(e) => {
    const updated = structuredClone(tempWorkout);
    updated.exercises[i].sets[idx].actualWeight = e.target.value;
    setTempWorkout(updated);
  }}
  className="w-16 bg-transparent text-white border border-white/20 rounded px-2 py-1 text-sm"
/>

            <input
  type="number"
  placeholder="reps"
  value={set.actualReps}
  onChange={(e) => {
    const updated = structuredClone(tempWorkout);
    updated.exercises[i].sets[idx].actualReps = e.target.value;
    setTempWorkout(updated);
  }}
  className="w-20 bg-white/10 text-white px-2 py-1 rounded"
/>
            <button
  onClick={() => {
    const updated = structuredClone(tempWorkout);

    updated.exercises[i].sets = updated.exercises[i].sets.filter(
      (_, sIdx) => sIdx !== idx
    );

    setTempWorkout(updated);
  }}
  className="text-red-400 text-xs px-1 transition-all duration-200 active:scale-[0.98]"
>
  <Trash2 size={16} />
</button>

          </div>
        ))}
      </div>

    </div>
  ))}
</div>
  )}
</div>
<button
  onClick={() => {
    if (!tempWorkout) return;

    // Remove existing workout for same date
    const filteredHistory = workoutHistory.filter(
      (w) => w.saveKey !== selectedDate
    );

    // Add new workout
    const updatedHistory = [tempWorkout, ...filteredHistory];

    setWorkoutHistory(updatedHistory);

    // Reset + close
    setShowLogOptions(false);
    setSelectedRoutine(null);
    setSelectedDay(null);
    setTempWorkout(null);
  }}
  className="w-full bg-green-600 text-white py-2 rounded-xl mb-3 transition-all duration-200 active:scale-[0.98]"
>
  Save Workout
</button>
      <button
        onClick={() => {
         setShowLogOptions(false);
         setSelectedRoutine(null);
         setSelectedDay(null);
        }}
        className="mt-4 text-sm text-white/60 transition-all duration-200 active:scale-[0.98]"
      >
        Cancel
      </button>
    </div>
  </div>
)}
    </>
  );
}