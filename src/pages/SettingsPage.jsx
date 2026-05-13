import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../supabaseClient";
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));
export default function SettingsPage(props) {
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    data,
    setData, 
    workoutHistory,
    selectedRoutine,
    selectedDay
  } = props;

 const [draftProgram, setDraftProgram] = useState({
  routines: [
    {
      name: "Routine 1",
      days: [
        {
          name: "Day 1",
          exercises: []
        }
      ]
    }
  ]
});

useEffect(() => {
  if (!data || isInitialized) return;

  const cloned = JSON.parse(JSON.stringify(data));
  const routinesArray = Array.isArray(cloned.routines)
  ? cloned.routines
  : Object.values(cloned.routines || {});

routinesArray.forEach(r => {
    r.days = r.days || [];
    r.days.forEach(d => {
      d.exercises = d.exercises || [];
      d.exercises.forEach(ex => {
        ex.sets = ex.sets || [];
      });
    });
  });
  
  cloned.routines = routinesArray;

  setDraftProgram(cloned);
  setIsInitialized(true); // ✅ runs ONLY once
}, [data, isInitialized]);

useEffect(() => {
  if (!isInitialized) return;

  if (!draftProgram || !draftProgram.routines) return;

  // prevent empty overwrite
  if (draftProgram.routines.length === 0) return;

  // 🔴 ONLY update if different
  if (JSON.stringify(draftProgram) !== JSON.stringify(data)) {
    setData(draftProgram);
  }
}, [draftProgram]);

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
  routinesArray[activeRoutineIndex] || null;

const [expandedDayIndex, setExpandedDayIndex] = useState(null);
const [expandedExercises, setExpandedExercises] = useState({});
const exerciseLibrary = [
  ...new Set(
    draftProgram?.routines || []
      .flatMap((routine) => routine.days || [])
      .flatMap((day) => day.exercises || [])
      .map((ex) => ex.name)
      .filter(Boolean)
  )
];
const [searchTerm, setSearchTerm] = useState("");

async function handleUploadToCloud() {
  try {
    console.log("MANUAL UPLOAD START");

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

    const { error } = await supabase
      .from("workout_data")
      .update({
        data: backupData,
      })
      .eq("user_id", "default-user");

    if (error) throw error;

    console.log("MANUAL UPLOAD SUCCESS");
    alert("Uploaded to cloud successfully");
  } catch (err) {
    console.error("Manual upload failed", err);
    alert("Upload failed");
  }
}

return (    
    <>
   <div className="mb-4 flex items-center gap-3">

  {/* Back */}
  <button
    onClick={() => {
      if (props.settingsSource === "preview") {
        props.setActiveTab("workout");
      } else {
        props.setActiveScreen("landing");
      }
    }}
    className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black/80 backdrop-blur-md text-white border border-white/10 hover:bg-black/70 active:scale-[0.97] transition"
  >
    <ArrowLeft size={16} />
  </button>

  {/* Routine Tabs */}
  <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap flex-1">
    {(draftProgram?.routines || []).map((routine, index) => (
      <div
        key={index}
        className={`shrink-0 px-4 py-3 rounded-2xl ${
          activeRoutineIndex === index
            ? "bg-purple-600"
            : "bg-black/80 backdrop-blur-md"
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
          className="bg-transparent text-white text-sm outline-none text-center min-w-[160px]"
        />
      </div>
    ))}

    <button
      onClick={() => {
        const copy = confirm("Copy last routine's routine?");

        setDraftProgram((prev) => {
          const updated = JSON.parse(JSON.stringify(prev));

          const routinesArray = updated.routines;

          let newRoutine;

          if (copy && routinesArray.length > 0) {
            newRoutine = JSON.parse(
              JSON.stringify(routinesArray[routinesArray.length - 1])
            );
          } else {
            newRoutine = {
              name: `Routine ${routinesArray.length + 1}`,
              days: [
                {
                  name: "New Day",
                  exercises: []
                }
              ]
            };
          }

          routinesArray.push(newRoutine);

          return updated;
        });
      }}
      className="shrink-0 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md text-white/70 transition-all duration-200 active:scale-[0.98]"
    >
      +
    </button>

    <button
      onClick={() => {
        const routinesArray = draftProgram.routines;

        if (routinesArray.length === 1) {
          alert("At least one routine is required.");
          return;
        }

        const routineName =
          routinesArray[activeRoutineIndex]?.name ||
          `Routine ${activeRoutineIndex + 1}`;

        if (!confirm(`Delete ${routineName}?`)) return;

        const updated = { ...draftProgram };
        const updatedRoutinesArray = [...updated.routines];

        updatedRoutinesArray.splice(activeRoutineIndex, 1);

        updated.routines = updatedRoutinesArray;

        setDraftProgram(updated);

        setActiveRoutineIndex((prev) =>
          Math.max(0, prev - 1)
        );
      }}
      className="shrink-0 text-red-400 hover:text-red-300 transition-all duration-200 active:scale-[0.98]"
    >
      <Trash2 size={22} />
    </button>
  </div>
</div>

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
      className={`group rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.992]
  ${
    expandedDayIndex === dayIndex
      ? "border-purple-500/50 bg-zinc-950 shadow-[0_0_30px_rgba(168,85,247,0.22)]"
      : "border-white/10 bg-zinc-950/92 hover:border-purple-500/30"
  }`}
        onClick={() =>
          setExpandedDayIndex(
            expandedDayIndex === dayIndex ? null : dayIndex
          )
        }
      >
        <div className="flex items-center gap-3 px-5 py-5">
<div className="flex items-center gap-4 flex-1">

  <div className="text-purple-400 text-sm font-semibold tracking-wide">
    {String(dayIndex + 1).padStart(2, "0")}
  </div>

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
    className="bg-transparent text-white text-lg font-semibold outline-none w-full"
  />
</div>
  <div className="flex items-center gap-4 ml-auto text-white/40">
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
  className="text-xs text-white/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
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
  className="text-xs text-white/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
>
  ↓
</button>

  <button
    onClick={(e) => {
      e.stopPropagation();
setDraftProgram((prev) => {
  const updated = JSON.parse(JSON.stringify(prev));

  const days =
    updated.routines[activeRoutineIndex].days;

  if (days.length === 1) {
    alert("At least one day is required.");
    return prev;
  }

  days.splice(dayIndex, 1);

  return updated;
});
    }}
    className="text-red-400 hover:text-red-300 transition-all duration-200 active:scale-[0.98]"
  >
    <Trash2 size={16} />
  </button>
</div>

</div>
<div className="px-5 pb-4 flex items-center justify-between text-xs text-white/35">
  <div>
    {day.exercises?.length || 0} exercises
  </div>

  <div className="text-purple-400/70">
    {expandedDayIndex === dayIndex ? "Collapse" : "Expand"}
  </div>
</div>
        {/* Expanded section */}
        {expandedDayIndex === dayIndex && (
  <div className="mt-3 space-y-2 animate-fadeSlide">
{day.exercises?.map((exercise, exIndex) => (
  <div
  key={exIndex}
  className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden"
>
    <div
  onClick={(e) => {
    e.stopPropagation();

    const key = `${dayIndex}-${exIndex}`;

    setExpandedExercises((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }}
  className="flex items-start gap-3 p-4 cursor-pointer"
>
  <div className="flex-1 transition-transform duration-150 active:scale-[0.985]">
    <input
  type="text"
  value={exercise.name ?? ""}
  onClick={(e) => e.stopPropagation()}
 onChange={(e) => {
  const value = e.target.value;

  setDraftProgram((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    updated.routines[activeRoutineIndex]
      .days[dayIndex]
      .exercises[exIndex]
      .name = value;

    return updated;
  });
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
  className="bg-transparent text-white text-lg font-semibold outline-none w-full"
/>
</div>
<div className="text-xs text-white/40 px-1">
  {expandedExercises[`${dayIndex}-${exIndex}`] ? "▲" : "▼"}
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
  className="text-xs text-white/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
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
  className="text-xs text-white/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
>
  ↓
</button>

<button
  onClick={(e) => {
  e.stopPropagation();

  if (!confirm("Delete this exercise and all its sets?")) return;

  setDraftProgram((prev) => {
    const updated = JSON.parse(JSON.stringify(prev));

    const exercises =
      updated.routines[activeRoutineIndex]
        .days[dayIndex]
        .exercises;

    if (exercises.length === 1) {
      alert("At least one exercise is required.");
      return prev;
    }

    exercises.splice(exIndex, 1);

    return updated;
  });
}}
  className="text-red-400 hover:text-red-300 transition transition-all duration-200 active:scale-[0.98]"
>
  <Trash2 size={16} />
</button>
    </div>

{expandedExercises[`${dayIndex}-${exIndex}`] && (
  <div className="mt-5 space-y-3 px-4 pb-4 animate-fadeSlide">
  {exercise.sets?.map((set, setIndex) => (
    <div
  key={setIndex}
  className="grid grid-cols-[50px_minmax(0,1fr)_minmax(0,1fr)_40px] items-center gap-3 rounded-2xl border border-white/5 bg-black/30 px-3 py-3 transition-all duration-150 active:scale-[0.99]"
>
  {/* Set Number */}
  <div className="flex items-center justify-center">
    <div className="w-9 h-9 rounded-full border border-purple-500/20 bg-purple-500/5 flex items-center justify-center text-sm font-semibold text-purple-300">
      {setIndex + 1}
    </div>
  </div>

  {/* Weight */}
  <div>
    <div className="w-full text-center text-[10px] uppercase tracking-wider text-white/30 mb-1">
      Weight/Band
    </div>

    <input
      type="text"
      value={set.weight || ""}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const value = e.target.value;

        setDraftProgram((prev) => {
          const updated = JSON.parse(JSON.stringify(prev));

          updated.routines[activeRoutineIndex]
            .days[dayIndex]
            .exercises[exIndex]
            .sets[setIndex]
            .weight = value;

          return updated;
        });
      }}
      className="no-spinner block w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white text-center"
    />
  </div>

  {/* Reps */}
  <div>
    <div className="w-full text-center text-[10px] uppercase tracking-wider text-white/30 mb-1">
      Reps/Secs
    </div>

    <input
      type="number"
      value={set.reps || ""}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const value = e.target.value;

        setDraftProgram((prev) => {
          const updated = JSON.parse(JSON.stringify(prev));

          updated.routines[activeRoutineIndex]
            .days[dayIndex]
            .exercises[exIndex]
            .sets[setIndex]
            .reps = Number(value);

          return updated;
        });
      }}
      className="no-spinner block w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white text-center"
    />
  </div>

  {/* Delete */}
  <button
    onClick={(e) => {
      e.stopPropagation();

      if (!confirm("Delete this set?")) return;

      setDraftProgram((prev) => {
        const updated = JSON.parse(JSON.stringify(prev));

        updated.routines[activeRoutineIndex]
          .days[dayIndex]
          .exercises[exIndex]
          .sets.splice(setIndex, 1);

        return updated;
      });
    }}
    className="flex items-center justify-center text-red-400 hover:text-red-300"
  >
    <Trash2 size={15} />
  </button>
</div>
  ))}
  <button
  onClick={(e) => {
    e.stopPropagation();

    setDraftProgram((prev) => {
  const updated = JSON.parse(JSON.stringify(prev));

  updated.routines[activeRoutineIndex]
    .days[dayIndex]
    .exercises[exIndex]
    .sets.push({ reps: "", weight: "" });

  return updated;
});
  }}
  className="mt-3 text-sm text-purple-300 hover:text-purple-200 transition-all duration-200 active:scale-[0.98]">
  + Add Set
</button>
</div>
)}
</div>
  ))}
    <button
  onClick={(e) => {
    e.stopPropagation();

   setDraftProgram((prev) => {
  const updated = JSON.parse(JSON.stringify(prev));

  updated.routines[activeRoutineIndex]
    .days[dayIndex]
    .exercises.push({
      name: "",
      sets: [{ reps: "", weight: "" }]
    });

  return updated;
});
  }}
  className="mt-4 w-full rounded-2xl border border-purple-500/20 bg-purple-500/5 py-3 text-sm text-purple-300 hover:bg-purple-500/10 transition-all duration-200 active:scale-[0.98]"
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
  className="mt-1 w-full rounded-2xl border border-white/30 bg-black/90 backdrop-blur-md py-3 text-sm text-purple-300 hover:bg-black/50 active:scale-[0.98] transition-all duration-200"
>
  + Add Day
</button>


      <div className="mt-6 mb-4 rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-md p-4">

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
            className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-medium text-white transition-all duration-200 active:scale-[0.98]"
          >
            Export Backup
          </button>

          <button
            onClick={() => {
              document
                .getElementById("backup-import-input")
                ?.click();
            }}
            className="flex-1 rounded-2xl border border-blue-500/30 bg-blue-600/20 p-4 text-sm font-medium text-blue-300 transition-all duration-200 active:scale-[0.98]"
          >
            Import Backup
          </button>
          <button
         onClick={handleUploadToCloud}
         className="flex-1 rounded-2xl bg-green-600/80 hover:bg-green-500 p-4 text-sm font-medium text-white transition-all duration-200 active:scale-[0.98]"
         >
          Cloud Upload
          </button>
        </div>
        

<button
  disabled
className={`mt-4 w-full rounded-2xl p-3 text-sm font-medium text-white ${
  "bg-black/60 backdrop-blur-md"
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

                const importedPlans = parsed.workoutPlans;
                
                if (
                  importedPlans?.routines &&
                  !Array.isArray(importedPlans.routines)
                ) {
                  importedPlans.routines =
                  Object.values(importedPlans.routines);
                }
                localStorage.setItem(
                  "workout-app-data",
                  JSON.stringify(importedPlans)
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