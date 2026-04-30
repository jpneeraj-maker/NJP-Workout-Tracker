import React from "react";
export default function HistoryPage(props) {
  const { workoutHistory, setWorkoutHistory, setActiveScreen } = props;

const [selectedDate, setSelectedDate] = React.useState(null);
const [currentMonth, setCurrentMonth] = React.useState(3); // April (0-based index)
const [currentYear, setCurrentYear] = React.useState(2026);

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
  if (workoutHistory.length > 0) {
    setSelectedDate(workoutHistory[0].saveKey);
  }
}, [workoutHistory]);

React.useEffect(() => {
  const workoutsInMonth = workoutHistory.filter((w) => {
    const date = new Date(w.saveKey);
    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  if (workoutsInMonth.length > 0) {
    // latest workout = first in array (assuming sorted)
    setSelectedDate(workoutsInMonth[0].saveKey);
  } else {
    setSelectedDate(null);
  }
}, [currentMonth, currentYear, workoutHistory]);
const workoutOptions = [
  { label: "Day 1 — Push" },
  { label: "Day 2 — Pull" },
  { label: "Day 3 — Legs" },
  { label: "Day 4 — Push" },
  { label: "Day 5 — Pull" },
];
const WORKOUT_SPLIT = {
  Day1: {
    label: "Push",
    exercises: [
      "Dumbbell Bench Press",
      "Dumbbell Incline Bench Press",
      "Dumbbell Seated Overhead Press",
      "EZ Bar Skull Crushers",
      "Dumbbell Lateral Raises"
    ]
  },

  Day2: {
    label: "Pull",
    exercises: [
      "Lat Pulldown",
      "Seated Row",
      "Face Pull",
      "Dumbbell Curl",
      "Hammer Curl"
    ]
  },

  Day3: {
    label: "Legs",
    exercises: [
      "Squat",
      "Romanian Deadlift",
      "Leg Press",
      "Leg Curl",
      "Calf Raises"
    ]
  },

  Day4: {
    label: "Push",
    exercises: [
      "Dumbbell Bench Press",
      "Dumbbell Incline Bench Press",
      "Dumbbell Seated Overhead Press",
      "EZ Bar Skull Crushers",
      "Dumbbell Lateral Raises"
    ]
  },

  Day5: {
    label: "Pull",
    exercises: [
      "Lat Pulldown",
      "Seated Row",
      "Face Pull",
      "Dumbbell Curl",
      "Hammer Curl"
    ]
  }
};
const selectedWorkout = selectedDate
  ? historyByDate[selectedDate]
  : null;

  return (
    <>
      {/* Back Button */}
      <div className="mb-4">
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
      <div className="flex items-center justify-center mb-4 text-white/80">
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


let dotColor = null;

if (workout?.workoutType === "Push") {
  dotColor = "bg-purple-500";
} else if (workout?.workoutType === "Pull") {
  dotColor = "bg-green-500";
} else if (workout?.workoutType === "Legs") {
  dotColor = "bg-yellow-400";
}
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
        <div className={`w-1.5 h-1.5 rounded-full mt-1 ${dotColor}`} />
      )}
    </div>
  );
})}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mb-6 text-xs text-white/60">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          Push
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          Pull
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          Legs
        </div>
      </div>

      {/* Selected Workout Panel */}
      <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
        {selectedWorkout ? (
          <>
            <div className="text-sm text-white/60 mb-1">
              {selectedWorkout.date}
            </div>

            <div className="text-lg font-semibold text-white mb-1">
  {selectedWorkout.workoutType}
</div>

<div className="text-xs text-white/50 mb-3">
  {selectedWorkout.exercises?.length || 0} exercises
</div>

            {/* Stats */}
            <div className="flex justify-between text-xs text-white/60 mb-4">
              <div>
                Duration: {selectedWorkout.duration || "-"}
              </div>
              <div>
                Exercises: {selectedWorkout.exercises?.length || 0}
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-4 text-sm text-white/80">
              {selectedWorkout.exercises.map((exercise, i) => {
  return (
    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="flex justify-between items-center mb-2">
  <div className="text-white font-medium">
    {exercise.name}
  </div>

  <button
    onClick={() => {
      const updatedHistory = workoutHistory.map((w) => {
        if (w.saveKey !== selectedDate) return w;

        return {
          ...w,
          exercises: w.exercises.map((ex, exIdx) => {
            if (exIdx !== i) return ex;

            return {
              ...ex,
              sets: [
                ...ex.sets,
                { actualWeight: "", actualReps: "" }
              ]
            };
          })
        };
      });

      setWorkoutHistory(updatedHistory);
    }}
    className="text-xs text-purple-400"
  >
    + Add Set
  </button>
</div>

      <div className="flex flex-col gap-2">
        {exercise.sets.map((set, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/5">

            <input
              type="number"
              placeholder="kg"
              value={set.actualWeight}
              onChange={(e) => {
                const updatedHistory = workoutHistory.map((w) => {
                  if (w.saveKey !== selectedDate) return w;

                  return {
                    ...w,
                    exercises: w.exercises.map((ex, exIdx) => {
                      if (exIdx !== i) return ex;

                      return {
                        ...ex,
                        sets: ex.sets.map((s, sIdx) => {
                          if (sIdx !== idx) return s;

                          return {
                            ...s,
                            actualWeight: e.target.value
                          };
                        })
                      };
                    })
                  };
                });

                setWorkoutHistory(updatedHistory);
              }}
              className="w-16 bg-transparent text-white border border-white/20 rounded px-2 py-1 text-sm"
            />

            <input
              type="number"
              placeholder="reps"
              value={set.actualReps}
              onChange={(e) => {
                const updatedHistory = workoutHistory.map((w) => {
                  if (w.saveKey !== selectedDate) return w;

                  return {
                    ...w,
                    exercises: w.exercises.map((ex, exIdx) => {
                      if (exIdx !== i) return ex;

                      return {
                        ...ex,
                        sets: ex.sets.map((s, sIdx) => {
                          if (sIdx !== idx) return s;

                          return {
                            ...s,
                            actualReps: e.target.value
                          };
                        })
                      };
                    })
                  };
                });

                setWorkoutHistory(updatedHistory);
              }}
              className="w-20 bg-white/10 text-white px-2 py-1 rounded"
            />
<button
  onClick={() => {
    const updatedHistory = workoutHistory.map((w) => {
      if (w.saveKey !== selectedDate) return w;

      return {
        ...w,
        exercises: w.exercises.map((ex, exIdx) => {
          if (exIdx !== i) return ex;

          return {
            ...ex,
            sets: ex.sets.filter((_, sIdx) => sIdx !== idx)
          };
        })
      };
    });

    setWorkoutHistory(updatedHistory);
  }}
  className="text-red-400 text-xs px-1"
>
  ✕
</button>
          </div>
        ))}
      </div>
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
            onClick={() => setShowLogOptions(true)}
            className="w-full bg-purple-600 text-white py-2 rounded-xl"
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
        {workoutOptions.map((opt, i) => (
          <button
            key={i}
            onClick={() => {
  // 1. Extract Day key (Day1, Day2...)
  const dayNumber = opt.label.split(" ")[1]; // "1"
  const formattedDay = `Day${dayNumber}`;

  const template = WORKOUT_SPLIT[formattedDay];

  if (!template || !selectedDate) return;

  // 2. Build new workout object
  const newWorkout = {
    saveKey: selectedDate,
    date: selectedDate,
    day: formattedDay,
    workoutType: template.label,
    exercises: template.exercises.map((name) => ({
      name,
      sets: [
        {
          actualWeight: "",
          actualReps: ""
        }
      ]
    }))
  };

  // 3. Remove existing workout for same date
  const filteredHistory = workoutHistory.filter(
    (w) => w.saveKey !== selectedDate
  );

  // 4. Add new workout
  const updatedHistory = [newWorkout, ...filteredHistory];
console.log("UPDATED HISTORY:", updatedHistory);

  // 5. Update state
  setWorkoutHistory(updatedHistory);

  // 6. Close modal
  setShowLogOptions(false);
}}
            className="w-full text-left bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white"
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowLogOptions(false)}
        className="mt-4 text-sm text-white/60"
      >
        Cancel
      </button>
    </div>
  </div>
)}
    </>
  );
}