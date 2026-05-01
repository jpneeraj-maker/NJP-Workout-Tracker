import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
export default function SettingsPage(props) {
  const {
    data,
    workoutHistory,
    selectedWeek,
    selectedDay
  } = props;

 const [draftProgram, setDraftProgram] = useState({ weeks: [] });

useEffect(() => {
  if (data) {
    const cloned = JSON.parse(JSON.stringify(data));

    // ensure weeks is always an array
    if (!Array.isArray(cloned.weeks)) {
      cloned.weeks = Object.values(cloned.weeks || {});
    }

    setDraftProgram(cloned);
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

const [activeWeekIndex, setActiveWeekIndex] = useState(0);
useEffect(() => {
  if (selectedWeek !== undefined) {
    setActiveWeekIndex(selectedWeek);
  }
}, [selectedWeek]);
console.log("DATA:", data);
console.log("DRAFT:", draftProgram);

const weeksArray = Object.values(draftProgram?.weeks || {});

const selectedWeekData =
  weeksArray.length > 0 && weeksArray[activeWeekIndex]
    ? weeksArray[activeWeekIndex]
    : null;

const [expandedDayIndex, setExpandedDayIndex] = useState(null);
const exerciseLibrary = [
  ...new Set(
    Object.values(draftProgram?.weeks || {})
      .flatMap((week) => week.days || [])
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
{Object.keys(draftProgram?.weeks || {}).length > 0 && (
  <div className="mb-4 flex gap-2 overflow-x-auto">
    {Object.values(draftProgram?.weeks || {}).map((week, index) => (
      <button
        key={index}
        onClick={() => setActiveWeekIndex(index)}
        className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap ${
          activeWeekIndex === index
            ? "bg-purple-600 text-white"
            : "bg-white/10 text-white/70"
        }`}
      >
        Week {index + 1}
      </button>
    ))}

      <button
onClick={() => {
  const copy = confirm("Copy last week's routine?");

  const updated = { ...draftProgram };
  const weeksArray = Object.values(updated.weeks);

  let newWeek;

  if (copy && weeksArray.length > 0) {
    // Deep copy last week
    newWeek = JSON.parse(
      JSON.stringify(weeksArray[weeksArray.length - 1])
    );
  } else {
    // Create empty week (1 empty day)
    newWeek = {
      days: [
        {
          name: "New Day",
          exercises: []
        }
      ]
    };
  }

  weeksArray.push(newWeek);

  updated.weeks = Object.fromEntries(
    weeksArray.map((w, i) => [i + 1, w])
  );

  setDraftProgram(updated);
}}
    className="px-4 py-2 rounded-xl bg-white/10 text-white/70"
  >
    + Add Week
  </button>

    <button
  onClick={() => {
    if (!confirm("Delete this week?")) return;

    const updated = { ...draftProgram };
    const weeksArray = Object.values(updated.weeks);

    // remove current week
    weeksArray.splice(activeWeekIndex, 1);

    // ensure at least one week exists
    if (weeksArray.length === 0) {
      weeksArray.push({
        days: [
          {
            name: "New Day",
            exercises: []
          }
        ]
      });
    }

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

    setDraftProgram(updated);

    // adjust active index
    setActiveWeekIndex((prev) =>
      Math.max(0, prev - 1)
    );
  }}
  className="text-red-400 hover:text-red-300 transition"
>
  <Trash2 size={16} />
</button>
  </div>
)}
{!selectedWeekData && (
  <div className="text-white/50 text-sm mt-4">
    No data available. Try importing backup.
  </div>
)}
{selectedWeekData && selectedWeekData.days && (
  <div className="mb-4 space-y-3">
    {selectedWeekData.days.map((day, dayIndex) => (
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
    value={day.name || `Day ${dayIndex + 1}`}
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => {
      const updated = { ...draftProgram };
      const weeksArray = Object.values(updated.weeks);

      weeksArray[activeWeekIndex]
        .days[dayIndex]
        .name = e.target.value;

      updated.weeks = Object.fromEntries(
        weeksArray.map((w, i) => [i + 1, w])
      );

      setDraftProgram(updated);
    }}
    onBlur={(e) => {
  if (!e.target.value.trim()) {
    const updated = { ...draftProgram };
    const weeksArray = Object.values(updated.weeks);

    weeksArray[activeWeekIndex]
      .days[dayIndex]
      .name = `Day ${dayIndex + 1}`;

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

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
    const weeksArray = Object.values(updated.weeks);

    const days = weeksArray[activeWeekIndex].days;

    [days[dayIndex - 1], days[dayIndex]] =
      [days[dayIndex], days[dayIndex - 1]];

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

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
    const weeksArray = Object.values(updated.weeks);

    const days = weeksArray[activeWeekIndex].days;

    if (dayIndex === days.length - 1) return;

    [days[dayIndex + 1], days[dayIndex]] =
      [days[dayIndex], days[dayIndex + 1]];

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

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
const weeksArray = Object.values(updated.weeks);

const days = weeksArray[activeWeekIndex].days;

if (days.length === 1) {
  alert("At least one day is required.");
  return;
}
      if (!confirm("Delete this day?")) return;

      weeksArray[activeWeekIndex].days.splice(dayIndex, 1);

      updated.weeks = Object.fromEntries(
        weeksArray.map((w, i) => [i + 1, w])
      );

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
<input
  type="text"
  value={exercise.name || ""}
  onClick={(e) => e.stopPropagation()}
  onChange={(e) => {
    const value = e.target.value;

    const updated = { ...draftProgram };
    const weeksArray = Object.values(updated.weeks);

    weeksArray[activeWeekIndex]
      .days[dayIndex]
      .exercises[exIndex]
      .name = value;

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

    setDraftProgram(updated);
    setSearchTerm(value);
  }}
  onBlur={(e) => {
  if (!e.target.value.trim()) {
    const updated = { ...draftProgram };
    const weeksArray = Object.values(updated.weeks);

    weeksArray[activeWeekIndex]
      .days[dayIndex]
      .exercises[exIndex]
      .name = "New Exercise";

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

    setDraftProgram(updated);
  }
}}
  className="bg-black text-white rounded px-2 py-1 text-sm border border-white/20 w-full"
/>
<button
  onClick={(e) => {
    e.stopPropagation();

    if (exIndex === 0) return;

    const updated = { ...draftProgram };
    const weeksArray = Object.values(updated.weeks);

    const exercises =
      weeksArray[activeWeekIndex].days[dayIndex].exercises;

    [exercises[exIndex - 1], exercises[exIndex]] =
      [exercises[exIndex], exercises[exIndex - 1]];

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

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
    const weeksArray = Object.values(updated.weeks);

    const exercises =
      weeksArray[activeWeekIndex].days[dayIndex].exercises;

    if (exIndex === exercises.length - 1) return;

    [exercises[exIndex + 1], exercises[exIndex]] =
      [exercises[exIndex], exercises[exIndex + 1]];

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

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
    const weeksArray = Object.values(updated.weeks);
const exercises =
  weeksArray[activeWeekIndex].days[dayIndex].exercises;

if (exercises.length === 1) {
  alert("At least one exercise is required.");
  return;
}
  if (!confirm("Delete this exercise and all its sets?")) return;
    exercises.splice(exIndex, 1);

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

    setDraftProgram(updated);
  }}
  className="text-red-400 hover:text-red-300 transition"
>
  <Trash2 size={16} />
</button>

{searchTerm && (
  <div className="mt-1 max-h-40 overflow-y-auto rounded bg-black border border-white/20">
    {exerciseLibrary
      .filter((ex) =>
        ex.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((ex, i) => (
        <div
          key={i}
          onClick={(e) => {
            e.stopPropagation();

            const updated = { ...draftProgram };
            const weeksArray = Object.values(updated.weeks);

            weeksArray[activeWeekIndex]
              .days[dayIndex]
              .exercises[exIndex]
              .name = ex;

            updated.weeks = Object.fromEntries(
              weeksArray.map((w, i) => [i + 1, w])
            );

            setDraftProgram(updated);
            setSearchTerm("");
          }}
          className="px-2 py-1 text-sm text-white hover:bg-white/10 cursor-pointer"
        >
          {ex}
        </div>
      ))}
  </div>
)}
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
          const weeksArray = Object.values(updated.weeks);

          weeksArray[activeWeekIndex]
            .days[dayIndex]
            .exercises[exIndex]
            .sets[setIndex]
            .reps = Number(e.target.value);

          updated.weeks = Object.fromEntries(
            weeksArray.map((w, i) => [i + 1, w])
          );

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
          const weeksArray = Object.values(updated.weeks);

          weeksArray[activeWeekIndex]
            .days[dayIndex]
            .exercises[exIndex]
            .sets[setIndex]
            .weight = Number(e.target.value);

          updated.weeks = Object.fromEntries(
            weeksArray.map((w, i) => [i + 1, w])
          );

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
    const weeksArray = Object.values(updated.weeks);

    weeksArray[activeWeekIndex]
      .days[dayIndex]
      .exercises[exIndex]
      .sets.splice(setIndex, 1);

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

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
    const weeksArray = Object.values(updated.weeks);

    weeksArray[activeWeekIndex]
      .days[dayIndex]
      .exercises[exIndex]
      .sets.push({
        reps: "",
        weight: ""
      });

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

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
    const weeksArray = Object.values(updated.weeks);

    weeksArray[activeWeekIndex]
      .days[dayIndex]
      .exercises.push({
        name: "",
        sets: [{ reps: "", weight: "" }]
      });

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

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
    const weeksArray = Object.values(updated.weeks);

    weeksArray[activeWeekIndex].days.push({
      name: `Day ${weeksArray[activeWeekIndex].days.length + 1}`,
      exercises: []
    });

    updated.weeks = Object.fromEntries(
      weeksArray.map((w, i) => [i + 1, w])
    );

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
                selectedWeek,
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
                  parsed.selectedWeek === undefined ||
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
                  "selected-week",
                  String(parsed.selectedWeek)
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