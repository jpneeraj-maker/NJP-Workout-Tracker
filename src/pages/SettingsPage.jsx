import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
export default function SettingsPage(props) {
  const {
    data,
    workoutHistory,
    selectedRoutine,
    selectedDay
  } = props;

 const [draftProgram, setDraftProgram] = useState({ routines: [] });

useEffect(() => {
  if (data) {
    const cloned = JSON.parse(JSON.stringify(data));

    // ensure routines is always an array
    if (!Array.isArray(cloned.routines)) {
      cloned.routines = Object.values(cloned.routines || {});
    }

    cloned.routines = cloned.routines || [];

    cloned.routines.forEach(r => {
      r.days = r.days || [];
      r.days.forEach(d => {
        d.exercises = d.exercises || [];
        d.exercises.forEach(ex => {
          ex.sets = ex.sets || [];
        });
      });
    });

    setDraftProgram(cloned);  // ✅ moved inside
  }
}, [data]);

const [saveStatus, setSaveStatus] = useState("");
useEffect(() => {
  if (!draftProgram) return;

  setSaveStatus("saving");

  const timeout = setTimeout(() => {
    localStorage.setItem(
      "workout-app-data",
      JSON.stringify(draftProgram)
    );

    setSaveStatus("Saved");

    setTimeout(() => {
      setSaveStatus("");
    }, 1500);
  }, 400); // debounce

  return () => clearTimeout(timeout);
}, [draftProgram]);

useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (saveStatus === "saving") {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [saveStatus]);

const [activeRoutineIndex, setActiveRoutineIndex] = useState(0);
useEffect(() => {
  if (selectedRoutine !== undefined) {
    setActiveRoutineIndex(selectedRoutine);
  }
}, [selectedRoutine]);
console.log("DATA:", data);
console.log("DRAFT:", draftProgram);

const routinesArray = draftProgram?.routines || [];
const selectedRoutineData =
  routinesArray.length > 0 && routinesArray[activeRoutineIndex]
    ? routinesArray[activeRoutineIndex]
    : null;

const [expandedDayIndex, setExpandedDayIndex] = useState(null);
const exerciseLibrary = [
  ...new Set(
    (Array.isArray(draftProgram?.routines)
      ? draftProgram.routines
      : []
    )
      .flatMap((routine) => routine.days || [])
      .flatMap((day) => day.exercises || [])
      .map((ex) => ex.name)
      .filter(Boolean)
  )
];
const [searchTerm, setSearchTerm] = useState("");


return (    
    <>
    <div className="mb-4">
  <button
        onClick={() => {
        if (props.settingsSource === "preview") {
        props.setActiveTab("workout");
        } else {
         props.setActiveScreen("landing");
         }
        }}
    className="text-sm text-white/70"
  >
    ← Back
  </button>
</div>
{(draftProgram?.routines || []).length > 0 && (
  <div className="mb-4 flex gap-2 overflow-x-auto">
    {(draftProgram?.routines || []).map((routine, index) => (
 <div
  key={index}
  className={`px-3 py-2 rounded-xl ${
    activeRoutineIndex === index
      ? "bg-purple-600"
      : "bg-white/10"
  }`}
>
  <input
    value={routine.name ?? ""}
    onClick={() => setActiveRoutineIndex(index)}
    onChange={(e) => {
    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    routinesArray[index].name = e.target.value; 

    updated.routines = routinesArray;

      setDraftProgram(updated);
    }}
      onBlur={(e) => {
    if (!e.target.value.trim()) {
      const updated = { ...draftProgram };
      const routinesArray = [...updated.routines];

      routinesArray[index].name = `Routine ${index + 1}`;

      updated.routines = routinesArray;

      setDraftProgram(updated);
    }
  }}
    className="bg-transparent text-white text-sm outline-none w-full"
  />
</div>
    ))}

      <button
onClick={() => {
  const copy = confirm("Copy last routine's routine?");

  const updated = { ...draftProgram };
  const routinesArray = [...updated.routines];

  let newroutine;

  if (copy && routinesArray.length > 0) {
    // Deep copy last routine
    newroutine = JSON.parse(
      JSON.stringify(routinesArray[routinesArray.length - 1])
    );
  } else {
    // Create empty routine (1 empty day)
    newroutine = {
        name: `Routine ${routinesArray.length + 1}`,
      days: [
        {
          name: "New Day",
          exercises: []
        }
      ]
    };
  }

  routinesArray.push(newroutine);

  updated.routines = routinesArray;

  setDraftProgram(updated);
}}
    className="px-4 py-2 rounded-xl bg-white/10 text-white/70"
  >
    + Add routine
  </button>

    <button
  onClick={() => {
  const routinesArray = draftProgram.routines;

  // 🔴 1. Prevent deleting last routine (ADD THIS HERE)
  if (routinesArray.length === 1) {
    alert("At least one routine is required.");
    return;
  }

  const routineName =
    routinesArray[activeRoutineIndex]?.name ||
    `Routine ${activeRoutineIndex + 1}`;

  // 🔴 2. Confirm AFTER guard
  if (!confirm(`Delete ${routineName}?`)) return;

  const updated = { ...draftProgram };
  const updatedRoutinesArray = [...updated.routines];

  // remove current routine
  updatedRoutinesArray.splice(activeRoutineIndex, 1);

  // 🔴 3. REMOVE this block (no longer needed)
  // if (routinesArray.length === 0) { ... }

  updated.routines = updatedRoutinesArray;

  setDraftProgram(updated);

  setActiveRoutineIndex((prev) =>
    Math.max(0, prev - 1)
  );
}}
  className="text-red-400 hover:text-red-300 transition"
>
  <Trash2 size={16} />
</button>
  </div>
)}
{!routinesArray.length ? (
  <div className="text-white/50 text-sm mt-4">
    No routines yet. Create one to begin.
  </div>
) : !selectedRoutineData ? (
  <div className="text-white/50 text-sm mt-4">
    No data available. Try importing backup.
  </div>
) : (
  <>
    {/* existing UI */}
  </>
)}
{selectedRoutineData && selectedRoutineData.days && (
  <div className="mb-4 space-y-3">
    {selectedRoutineData.days.map((day, dayIndex) => (
      <div
        key={dayIndex}
        className="rounded-2xl bg-white/10 p-4 text-white cursor-pointer"
        onClick={() =>
          setExpandedDayIndex(
            expandedDayIndex === dayIndex ? null : dayIndex
          )
        }
      >
        <div className="flex items-center justify-between">
  <input
    type="text"
    value={day.name ?? ""}
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => {
      const updated = { ...draftProgram };
      const routinesArray = [...updated.routines];

      routinesArray[activeRoutineIndex]
        .days[dayIndex]
        .name = e.target.value;

      updated.routines = routinesArray;

      setDraftProgram(updated);
    }}
    onBlur={(e) => {
  if (!e.target.value.trim()) {
    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    routinesArray[activeRoutineIndex]
      .days[dayIndex]
      .name = `Day ${dayIndex + 1}`;

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }
}}
    className="bg-transparent text-white font-medium outline-none"
  />
  <div className="flex items-center gap-2 ml-auto">
  <button
  onClick={(e) => {
    e.stopPropagation();

    if (dayIndex === 0) return;

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    const days = routinesArray[activeRoutineIndex].days;

    [days[dayIndex - 1], days[dayIndex]] =
      [days[dayIndex], days[dayIndex - 1]];

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="text-xs text-white/50 hover:text-white"
>
  ↑
</button>

<button
  onClick={(e) => {
    e.stopPropagation();

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    const days = routinesArray[activeRoutineIndex].days;

    if (dayIndex === days.length - 1) return;

    [days[dayIndex + 1], days[dayIndex]] =
      [days[dayIndex], days[dayIndex + 1]];

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="text-xs text-white/50 hover:text-white"
>
  ↓
</button>

  <button
    onClick={(e) => {
      e.stopPropagation();
const updated = { ...draftProgram };
const routinesArray = [...updated.routines];

const days = routinesArray[activeRoutineIndex].days;

if (days.length === 1) {
  alert("At least one day is required.");
  return;
}
      if (!confirm("Delete this day?")) return;

      routinesArray[activeRoutineIndex].days.splice(dayIndex, 1);

      updated.routines = routinesArray;
      setDraftProgram(updated);
    }}
    className="text-red-400 hover:text-red-300"
  >
    <Trash2 size={16} />
  </button>
</div>

</div>

        {/* Expanded section */}
        {expandedDayIndex === dayIndex && (
          <div className="mt-3 space-y-2">
{day.exercises?.map((exercise, exIndex) => (
  <div key={exIndex} className="text-sm text-white/70">
    <div className="flex items-center justify-between gap-2">
  <div className="relative w-full">
    <input
  type="text"
  value={exercise.name ?? ""}
  onClick={(e) => e.stopPropagation()}
  onChange={(e) => {
    const value = e.target.value;

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    routinesArray[activeRoutineIndex]
      .days[dayIndex]
      .exercises[exIndex]
      .name = value;

    updated.routines = routinesArray;

    setDraftProgram(updated);
    setSearchTerm(value);
  }}
onBlur={(e) => {
  setTimeout(() => {
    if (!e.target.value.trim()) {
      const updated = { ...draftProgram };
      const routinesArray = [...updated.routines];

      routinesArray[activeRoutineIndex]
        .days[dayIndex]
        .exercises[exIndex]
        .name = "New Exercise";

      updated.routines = routinesArray;
      setDraftProgram(updated);
    }

    setSearchTerm(""); // 🔴 ADD THIS
  }, 150);
}}
  className="bg-black text-white rounded px-2 py-1 text-sm border border-white/20 w-full"
/>
{/*searchTerm && (
  <div className="absolute top-full left-0 w-full mt-1 max-h-40 overflow-y-auto rounded-xl bg-black border border-white/10 z-50 shadow-lg">
    {exerciseLibrary
      .filter((ex) =>
        ex.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5)
      .map((ex, i) => (
        <div
          key={i}
          onClick={(e) => {
  e.preventDefault();   // 🔴 ADD
  e.stopPropagation();

  const updated = { ...draftProgram };
  const routinesArray = [...updated.routines];

  routinesArray[activeRoutineIndex]
    .days[dayIndex]
    .exercises[exIndex]
    .name = ex;

  updated.routines = routinesArray;

  setDraftProgram(updated);

  setSearchTerm("");   // closes dropdown
}}
          className="px-3 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
        >
          {ex}
        </div>
      ))}
  </div>
)*/}
</div>
<button
  onClick={(e) => {
    e.stopPropagation();

    if (exIndex === 0) return;

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    const exercises =
      routinesArray[activeRoutineIndex].days[dayIndex].exercises;

    [exercises[exIndex - 1], exercises[exIndex]] =
      [exercises[exIndex], exercises[exIndex - 1]];

    updated.routines = routinesArray;
    setDraftProgram(updated);
  }}
  className="text-xs text-white/50 hover:text-white"
>
  ↑
</button>

<button
  onClick={(e) => {
    e.stopPropagation();

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    const exercises =
      routinesArray[activeRoutineIndex].days[dayIndex].exercises;

    if (exIndex === exercises.length - 1) return;

    [exercises[exIndex + 1], exercises[exIndex]] =
      [exercises[exIndex], exercises[exIndex + 1]];

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="text-xs text-white/50 hover:text-white"
>
  ↓
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];
const exercises =
  routinesArray[activeRoutineIndex].days[dayIndex].exercises;

if (exercises.length === 1) {
  alert("At least one exercise is required.");
  return;
}
  if (!confirm("Delete this exercise and all its sets?")) return;
    exercises.splice(exIndex, 1);

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="text-red-400 hover:text-red-300 transition"
>
  <Trash2 size={16} />
</button>
    </div>

<div className="ml-3 mt-2 space-y-2 text-xs text-white/50">
  {exercise.sets?.map((set, setIndex) => (
    <div key={setIndex} className="flex items-center gap-2">
      <span>Set {setIndex + 1}:</span>

      <input
        type="number"
        value={set.reps || ""}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const updated = { ...draftProgram };
          const routinesArray = [...updated.routines];

          routinesArray[activeRoutineIndex]
            .days[dayIndex]
            .exercises[exIndex]
            .sets[setIndex]
            .reps = Number(e.target.value);

          updated.routines = routinesArray;

          setDraftProgram(updated);
        }}
        className="w-12 rounded bg-white/10 px-1 text-white"
      />

      <span>reps X</span>

      <input
        type="number"
        value={set.weight || ""}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const updated = { ...draftProgram };
          const routinesArray = [...updated.routines];

          routinesArray[activeRoutineIndex]
            .days[dayIndex]
            .exercises[exIndex]
            .sets[setIndex]
            .weight = Number(e.target.value);

          updated.routines = routinesArray;
          setDraftProgram(updated);
        }}
        className="w-16 rounded bg-white/10 px-1 text-white"
      />

      <span>kg</span>
<button
  onClick={(e) => {
    e.stopPropagation();

    if (!confirm("Delete this set?")) return;

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    routinesArray[activeRoutineIndex]
      .days[dayIndex]
      .exercises[exIndex]
      .sets.splice(setIndex, 1);

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="text-red-400 hover:text-red-300 transition"
>
  <Trash2 size={14} />
</button>
    </div>
  ))}
  <button
  onClick={(e) => {
    e.stopPropagation();

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    routinesArray[activeRoutineIndex]
      .days[dayIndex]
      .exercises[exIndex]
      .sets.push({
        reps: "",
        weight: ""
      });

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="mt-2 text-xs text-purple-300"
>
  + Add Set
</button>
</div>
  </div>
  ))}
    <button
  onClick={(e) => {
    e.stopPropagation();

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    routinesArray[activeRoutineIndex]
      .days[dayIndex]
      .exercises.push({
        name: "",
        sets: [{ reps: "", weight: "" }]
      });

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="mt-3 text-sm text-purple-300"
>
  + Add Exercise
</button>
          </div>
        )}
      </div>
    ))}
  </div>
)}

<button
  onClick={(e) => {
    e.stopPropagation();

    const updated = { ...draftProgram };
    const routinesArray = [...updated.routines];

    routinesArray[activeRoutineIndex].days.push({
      name: `Day ${routinesArray[activeRoutineIndex].days.length + 1}`,
      exercises: []
    });

    updated.routines = routinesArray;

    setDraftProgram(updated);
  }}
  className="mt-3 text-sm text-purple-300"
>
  + Add Day
</button>


      <div className="mb-4 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
        <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-[#d7c7a4]/70">
          Backup & Restore
        </div>

        <div className="mb-4 text-sm leading-6 text-white/60">
          Export a full backup before making changes. Import restores workout
          plans, workout history, active workout state and settings.
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              const backupData = {
                workoutPlans: data,
                workoutHistory,
                activeWorkoutState: JSON.parse(
                  localStorage.getItem("active-workout-state") || "{}"
                ),
                selectedRoutine,
                selectedDay,
                exportDate: new Date().toISOString(),
                version: 1,
              };

              const json = JSON.stringify(backupData, null, 2);

              const blob = new Blob([json], {
                type: "application/json",
              });

              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");

              const date = new Date().toISOString().slice(0, 10);

              link.href = url;
              link.download = `workout-backup-${date}.json`;

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              URL.revokeObjectURL(url);
            }}
            className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-medium text-white"
          >
            Export Backup
          </button>

          <button
            onClick={() => {
              document
                .getElementById("backup-import-input")
                ?.click();
            }}
            className="flex-1 rounded-2xl border border-blue-500/30 bg-blue-600/20 p-3 text-sm font-medium text-blue-300"
          >
            Import Backup
          </button>
        </div>
<button
  disabled
className={`mt-4 w-full rounded-2xl p-3 text-sm font-medium text-white ${
  "bg-white/10"
} ${saveStatus === "saving" ? "opacity-60 cursor-not-allowed" : ""}`}
>
{
  saveStatus === "saving"
    ? "Saving..."
    : saveStatus === "Saved"
    ? "Saved ✓"
    : "All changes saved"
}
</button>

        <input
          id="backup-import-input"
          type="file"
          accept=".json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = (e) => {
              try {
                const parsed = JSON.parse(e.target.result);

                if (
                  !parsed.workoutPlans ||
                  !parsed.workoutHistory ||
                  parsed.selectedRoutine === undefined ||
                  parsed.selectedDay === undefined
                ) {
                  alert("Invalid backup file");
                  return;
                }

                localStorage.setItem(
                  "workout-app-data",
                  JSON.stringify(parsed.workoutPlans)
                );

                localStorage.setItem(
                  "workout-history",
                  JSON.stringify(parsed.workoutHistory)
                );

                localStorage.setItem(
                  "active-workout-state",
                  JSON.stringify(parsed.activeWorkoutState || {})
                );

                localStorage.setItem(
                  "selected-routine",
                  String(parsed.selectedRoutine)
                );

                localStorage.setItem(
                  "selected-day",
                  String(parsed.selectedDay)
                );

                alert("Backup restored. The app will now reload.");
                window.location.reload();
              } catch {
                alert("Invalid backup file");
              }
            };

            reader.readAsText(file);

            event.target.value = "";
          }}
        />
      </div>
    </>
  );
}