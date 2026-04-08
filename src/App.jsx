import { useEffect, useState } from "react";
import { workoutData } from "./workoutData.js";
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
const [workoutMode, setWorkoutMode] = useState(false);
const [timeLeft, setTimeLeft] = useState(null);
const [timerRunning, setTimerRunning] = useState(false);

const [workoutHistory, setWorkoutHistory] = useState(() => {
  const saved = localStorage.getItem("workout-history");
  return saved ? JSON.parse(saved) : [];
});
const [expandedHistoryIndex, setExpandedHistoryIndex] = useState(null);
const [activeTab, setActiveTab] = useState("workout");
const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(null);
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
  let interval = null;

  if (timerRunning && timeLeft > 0) {
    interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
} else if (timerRunning && timeLeft === 0) {
  setTimerRunning(false);

  try {
    let audioContext = window.restTimerAudioContext;

    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      window.restTimerAudioContext = audioContext;
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 1
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
  } catch (error) {
    console.error("Timer sound failed:", error);
  }
}

  return () => clearInterval(interval);
}, [timerRunning, timeLeft]);
  const currentWeek = data.weeks[selectedWeek];
  const currentDay = currentWeek.days[selectedDay];

  function updateSet(exerciseIndex, setIndex, field, value) {
    const updated = { ...data };
    updated.weeks[selectedWeek].days[selectedDay].exercises[exerciseIndex].sets[
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

    updated.weeks[selectedWeek].days[selectedDay].exercises.push({
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

    updated.weeks[selectedWeek].days[selectedDay].exercises.splice(
      exerciseIndex,
      1
    );

    return updated;
  });
}
function handleRemoveSet(exerciseIndex, setIndex) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    updated.weeks[selectedWeek].days[selectedDay].exercises[
      exerciseIndex
    ].sets.splice(setIndex, 1);

    return updated;
  });
}
function handleAddSet(exerciseIndex) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    const sets =
      updated.weeks[selectedWeek].days[selectedDay].exercises[exerciseIndex]
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
function moveExercise(exerciseIndex, direction) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    const exercises =
      updated.weeks[selectedWeek].days[selectedDay].exercises;

    const newIndex = exerciseIndex + direction;

    if (newIndex < 0 || newIndex >= exercises.length) {
      return prev;
    }

    [exercises[exerciseIndex], exercises[newIndex]] = [
      exercises[newIndex],
      exercises[exerciseIndex],
    ];

    return updated;
  });
}
function moveSet(exerciseIndex, setIndex, direction) {
  setData((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    const sets =
      updated.weeks[selectedWeek].days[selectedDay].exercises[exerciseIndex]
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
    exercises: currentDay.exercises.map((exercise) => ({
      name: exercise.name,
      remarks: exercise.remarks || "",
      sets: exercise.sets.map((set) => ({
        type: set.type,
        plannedWeight: set.plannedWeight,
        targetReps: set.targetReps,
        actualWeight: set.actualWeight || "",
        actualReps: set.actualReps || "",
      })),
    })),
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

  alert("Workout saved to history");
}
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-1">Workout Tracker</h1>
      <p className="text-zinc-400 mb-4">
        Planned sets, target reps and actual performance
      </p>
      <div className="flex gap-2 mb-4">
  <button
    onClick={() => setActiveTab("workout")}
    className={`flex-1 p-3 rounded-2xl font-semibold ${
      activeTab === "workout"
        ? "bg-emerald-600 text-white"
        : "bg-zinc-800 text-zinc-300"
    }`}
  >
    Workout
  </button>

  <button
    onClick={() => setActiveTab("history")}
    className={`flex-1 p-3 rounded-2xl font-semibold ${
      activeTab === "history"
        ? "bg-emerald-600 text-white"
        : "bg-zinc-800 text-zinc-300"
    }`}
  >
    History
  </button>

  <button
    onClick={() => setActiveTab("settings")}
    className={`flex-1 p-3 rounded-2xl font-semibold ${
      activeTab === "settings"
        ? "bg-emerald-600 text-white"
        : "bg-zinc-800 text-zinc-300"
    }`}
  >
    Settings
  </button>
</div>
{activeTab === "workout" && (
<div className={workoutMode ? "sticky top-0 z-50 bg-black pt-2 pb-3" : ""}>
  <button
    onClick={() => setWorkoutMode(!workoutMode)}
    className="w-full mb-4 py-3 rounded-2xl bg-purple-600 text-white text-lg font-semibold"
  >
    {workoutMode ? "Exit Workout Mode" : "Workout Mode"}
  </button>

  {workoutMode && (
    <div className="mb-4 p-4 rounded-2xl bg-zinc-900 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            let audioContext = window.restTimerAudioContext;

            if (!audioContext) {
              audioContext = new (window.AudioContext || window.webkitAudioContext)();
              window.restTimerAudioContext = audioContext;
            }

            if (audioContext.state === "suspended") {
              audioContext.resume();
            }

            setTimeLeft(60);
            setTimerRunning(true);
          }}
          className="p-3 rounded-2xl bg-zinc-800 text-white font-semibold"
        >
          60s
        </button>

        <button
          onClick={() => {
            let audioContext = window.restTimerAudioContext;

            if (!audioContext) {
              audioContext = new (window.AudioContext || window.webkitAudioContext)();
              window.restTimerAudioContext = audioContext;
            }

            if (audioContext.state === "suspended") {
              audioContext.resume();
            }

            setTimeLeft(90);
            setTimerRunning(true);
          }}
          className="p-3 rounded-2xl bg-zinc-800 text-white font-semibold"
        >
          90s
        </button>

        <button
          onClick={() => {
            let audioContext = window.restTimerAudioContext;

            if (!audioContext) {
              audioContext = new (window.AudioContext || window.webkitAudioContext)();
              window.restTimerAudioContext = audioContext;
            }

            if (audioContext.state === "suspended") {
              audioContext.resume();
            }

            setTimeLeft(120);
            setTimerRunning(true);
          }}
          className="p-3 rounded-2xl bg-zinc-800 text-white font-semibold"
        >
          120s
        </button>

        <button
          onClick={() => {
            let audioContext = window.restTimerAudioContext;

            if (!audioContext) {
              audioContext = new (window.AudioContext || window.webkitAudioContext)();
              window.restTimerAudioContext = audioContext;
            }

            if (audioContext.state === "suspended") {
              audioContext.resume();
            }

            setTimeLeft(180);
            setTimerRunning(true);
          }}
          className="p-3 rounded-2xl bg-zinc-800 text-white font-semibold"
        >
          180s
        </button>
      </div>

      {timeLeft !== null && (
        <div className="text-center text-2xl font-bold">
          {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
          {String(timeLeft % 60).padStart(2, "0")}
        </div>
      )}
      <button
  onClick={handleFinishWorkout}
  className="w-full p-3 rounded-2xl bg-emerald-600 text-white font-semibold"
>
  Finish Workout
</button>
    </div>
  )}
</div>
)}
{activeTab === "workout" && !workoutMode && (
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {Object.keys(data.weeks).map((week) => (
          <button
            key={week}
            onClick={() => {
              setSelectedWeek(Number(week));
              setSelectedDay((prevDay) => {
                const days = data.weeks[week].days;
                return days[prevDay] ? prevDay : 0;
              });
            }}
            className={`px-4 py-2 rounded-xl whitespace-nowrap ${
              Number(selectedWeek) === Number(week)
                ? "bg-emerald-500 text-black"
                : "bg-zinc-800"
            }`}
          >
            Week {week}
          </button>
        ))}

        <button
          onClick={handleAddWeek}
          className="px-4 py-2 rounded-xl bg-blue-600 whitespace-nowrap"
        >
          + New Week
        </button>
      </div>
)}
{activeTab === "workout" && !workoutMode && (
  <>

    <div className="flex gap-2 mb-4 overflow-x-auto">
        {currentWeek.days.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDay(index)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap ${
              selectedDay === index ? "bg-zinc-700" : "bg-zinc-800"
            }`}
          >
            {day.name}
          </button>
        ))}
      </div>
  </>
)}
{activeTab === "workout" && (
  <>
    {currentDay.exercises.map((exercise, exerciseIndex) => (
        <div
          key={exerciseIndex}
          className="bg-zinc-900 rounded-3xl p-4 mb-4"
        >
<button
  onClick={() =>
    setExpandedExerciseIndex(
      expandedExerciseIndex === exerciseIndex
        ? null
        : exerciseIndex
    )
  }
  className="w-full flex items-center gap-2 mb-4 text-left"
>
  {workoutMode ? (
    <h2 className="flex-1 text-2xl font-semibold">{exercise.name}</h2>
  ) : (
    <input
      value={exercise.name}
      onChange={(e) => {
        const updated = { ...data };
        updated.weeks[selectedWeek].days[selectedDay].exercises[
          exerciseIndex
        ].name = e.target.value;
        setData(updated);
      }}
      className="flex-1 bg-transparent text-xl font-semibold border-b border-zinc-700 pb-2"
    />
  )}

{!workoutMode && (
  <div className="flex items-center gap-2">
    {exerciseIndex > 0 && (
      <button
        onClick={() => moveExercise(exerciseIndex, -1)}
        className="text-zinc-400 text-sm"
      >
        ↑
      </button>
    )}

    {exerciseIndex < currentDay.exercises.length - 1 && (
      <button
        onClick={() => moveExercise(exerciseIndex, 1)}
        className="text-zinc-400 text-sm"
      >
        ↓
      </button>
    )}

    <button
      onClick={() => handleAddSet(exerciseIndex)}
      className="text-emerald-400 text-sm"
    >
      +Set
    </button>

    <button
      onClick={() => {
        if (window.confirm(`Delete ${exercise.name}?`)) {
          handleRemoveExercise(exerciseIndex);
        }
      }}
      className="text-red-500 text-lg"
    >
      🗑️
    </button>
  </div>
)}
</button>
{expandedExerciseIndex === exerciseIndex && (
  <div className="space-y-3">
            {exercise.sets.map((set, setIndex) => (
              <div
                key={setIndex}
                className="bg-zinc-800 rounded-2xl p-3 grid grid-cols-4 gap-2 text-sm"
              >
<div className="col-span-4 flex justify-between items-center font-medium text-zinc-300">
  {workoutMode ? (
    <div className="text-lg font-semibold">{set.type}</div>
  ) : (
    <>
      <input
        type="text"
        value={set.type}
        onChange={(e) =>
          updateSet(exerciseIndex, setIndex, "type", e.target.value)
        }
        className="border rounded px-2 py-1 w-full max-w-[180px] bg-zinc-700 text-white"
      />

      {setIndex > 0 && (
        <button
          onClick={() => moveSet(exerciseIndex, setIndex, -1)}
          className="text-zinc-400 text-sm"
        >
          ↑
        </button>
      )}

      {setIndex < exercise.sets.length - 1 && (
        <button
          onClick={() => moveSet(exerciseIndex, setIndex, 1)}
          className="text-zinc-400 text-sm"
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
        className="text-red-500 text-sm"
      >
        🗑️
      </button>
    </>
  )}
  </div>
                <div>
                  <div className="text-zinc-500 text-xs mb-1">Target Wt</div>
                  <input
                  type="text"
                  inputMode="decimal"
                  readOnly={workoutMode}
                    value={set.plannedWeight}
                    onChange={(e) =>
                      updateSet(
                        exerciseIndex,
                        setIndex,
                        "plannedWeight",
                        e.target.value
                      )
                    }
className={`w-full bg-zinc-900 rounded-lg px-2 py-2 ${
  workoutMode ? "text-zinc-400" : ""
}`}
                  />
                </div>

                <div>
                  <div className="text-zinc-500 text-xs mb-1">Target Reps</div>
                  <input
                  type="text"
                  inputMode="decimal"
                  readOnly={workoutMode}
                    value={set.targetReps}
                    onChange={(e) =>
                      updateSet(
                        exerciseIndex,
                        setIndex,
                        "targetReps",
                        e.target.value
                      )
                    }
className={`w-full bg-zinc-900 rounded-lg px-2 py-2 ${
  workoutMode ? "text-zinc-400" : ""
}`}
                  />
                </div>

                <div>
                  <div className="text-zinc-500 text-xs mb-1">Actual Wt</div>
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
                    className="w-full bg-zinc-900 rounded-lg px-2 py-2"
                  />
                </div>

                <div>
                  <div className="text-zinc-500 text-xs mb-1">Actual Reps</div>
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
                    className="w-full bg-zinc-900 rounded-lg px-2 py-2"
                  />
                </div>
              </div>
            ))}
<textarea
  value={exercise.remarks || ""}
  onChange={(e) =>
    updateExerciseRemark(
      selectedWeek,
      selectedDay,
      exerciseIndex,
      e.target.value
    )
  }
  placeholder="Remarks / notes about this exercise..."
  rows={3}
  className="w-full mt-3 p-3 rounded-2xl bg-zinc-800 text-white border border-zinc-700"
/>
  </div>
)}
</div>
))}
    {!workoutMode && (
      <button
        onClick={handleAddExercise}
        className="w-full mt-4 p-3 rounded-2xl bg-green-600 text-white"
      >
        + Add Exercise
      </button>
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
            {workout.date} — Week {workout.week} — {workout.day}
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
</div>
  );
}