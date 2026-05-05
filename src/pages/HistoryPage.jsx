import React from "react";
import { Trash2 } from "lucide-react";
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

React.useEffect(() => {
  const today = new Date();

  setSelectedDate(getTodayKey());
}, []);

React.useEffect(() => {
  // Only run when history changes (new data added)
  const todayKey = getTodayKey();
  setSelectedDate(todayKey);
}, [workoutHistory]);

const selectedWorkout = selectedDate
  ? historyByDate[selectedDate]
  : null;

  return (
    <>
      {/* Back Button */}
      <div className="mb-4 transition-all duration-200 active:scale-[0.98]">
        <button
          onClick={() => {
            window.history.pushState({}, "");
            setActiveScreen("landing");
          }}
          className="text-sm text-white/70"
        >
          ← Back
        </button>
      </div>

      {/* Header */}
      <div className="mb-4 text-center">
        <div className="text-xl font-semibold text-white">
          Workout History
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
        <div className="text-sm font-medium">
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
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-white/70 mb-4">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}

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


const dotColor = workout ? "bg-purple-500" : null;

  const isSelected = selectedDate === dateKey;


  return (
    <div
      key={i}
      onClick={() => setSelectedDate(dateKey)}
      className={`h-10 flex flex-col items-center justify-center rounded-lg cursor-pointer
        ${isSelected ? "bg-purple-600/30 border border-purple-500" : "bg-white/5"}
      `}
    >
      <div>{date}</div>

      {dotColor && (
        <div className={`w-2 h-2 rounded-full mt-1 ${dotColor}`} />
      )}
    </div>
  );
})}
      </div>

      {/* Selected Workout Panel */}
      <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
        {selectedWorkout ? (
          <>
<div className="grid grid-cols-2 gap-y-2 mb-4 text-sm">

  {/* Row 1 */}
  <div className="text-white/70">
    {new Date(selectedWorkout.date).toLocaleDateString("en-GB")}
  </div>

  <div className="text-right text-white font-medium">
    {selectedWorkout.routineName
  ? `${selectedWorkout.routineName} | ${selectedWorkout.workoutType}`
  : selectedWorkout.workoutType}
  </div>

  {/* Row 2 */}
  <div className="text-white/60 text-xs">
    Duration: {selectedWorkout.duration || "-"}
  </div>

  <div className="text-right text-white/60 text-xs">
    Exercises: {selectedWorkout.exercises?.length || 0}
  </div>

</div>
            {/* Exercises */}
            <div className="space-y-3 text-sm text-white/80">
             {selectedWorkout.exercises.map((exercise, i) => {
  const isExpanded = expandedExerciseIndex === i;

  return (
    <div
  key={i}
 className={`rounded-2xl p-4 transition-all duration-200
  ${
    isExpanded
      ? "border border-purple-400 bg-purple-400/10 shadow-lg shadow-purple-500/20"
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
    {exercise.name}
  </div>

  {/* Right: Summary + Arrow */}
  <div className="flex items-center gap-3">

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
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {exercise.sets.map((set, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center text-sm bg-white/[0.04] px-4 py-2 rounded-xl border border-white/[0.05]"
            >
              <div className="text-purple-300 text-xs">
                SET {idx + 1}
              </div>

              <div className="font-semibold text-white">
                {set.actualWeight || "-"} kg × {set.actualReps || "-"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
})}
            </div>
          </>
        ) : 
        (
          <>
            <div className="text-white/60 text-sm mb-4">
              No workout done on this day.
            </div>

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
    routines?.map((routine, i) => (
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
  saveKey: selectedDate,
  date: selectedDate,

  routineName: selectedRoutine.name,   // ✅ ADD THIS
  workoutType: day.name,

  exercises: day.exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets.map(() => ({
      actualWeight: "",
      actualReps: ""
    }))
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
    const updated = { ...tempWorkout };
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
    const updated = { ...tempWorkout };
    updated.exercises[i].sets[idx].actualReps = e.target.value;
    setTempWorkout(updated);
  }}
  className="w-20 bg-white/10 text-white px-2 py-1 rounded"
/>
            <button
  onClick={() => {
    const updated = { ...tempWorkout };

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