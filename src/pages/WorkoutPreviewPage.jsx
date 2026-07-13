import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
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
    setWorkoutMode
  } = props;
  console.log("Preview FULL data:", data);
  const currentRoutine = data?.routines?.[selectedRoutine];
  const currentDay = currentRoutine?.days?.[selectedDay];
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [hasPausedWorkout, setHasPausedWorkout] = useState(false);
useEffect(() => {
  const saved = JSON.parse(
    localStorage.getItem("active-workout-state") || "null"
  );

  setHasPausedWorkout(saved?.isPaused === true);
}, [selectedRoutine, selectedDay]);

  function navigateWithTransition(callback, direction = "forward") {
  setTransitionDirection(direction);
  setIsTransitioning(true);

  setTimeout(() => {
    callback();
    setIsTransitioning(false);
  }, 250);
}

console.log("Selected Routine:", selectedRoutine);
console.log("Routine Keys:", Object.keys(data?.routines || {}));
console.log("Current Routine:", currentRoutine);

return (
  <>

<div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center">

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

  {/* CENTER — Routines */}
<div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-2">
  {Object.keys(data?.routines || {}).map((routineKey) => (
    <button
      key={routineKey}
      onClick={() => {
        console.log("Clicked:", routineKey);
        setSelectedRoutine(routineKey);
        setSelectedDay(0);
      }}
      className={`px-6 py-1 rounded-xl text-sm whitespace-nowrap ${
        routineKey === selectedRoutine
          ? "bg-[#c7a86a] text-black"
          : "bg-black/40 text-white border border-white/10"
      }`}
    >
      {data?.routines?.[routineKey]?.name || `Routine ${Number(routineKey) + 1}`}
    </button>
  ))}
</div>

  {/* RIGHT — Edit */}
  <div className="flex justify-end">
    <button
      onClick={() =>
        navigateWithTransition(() => {
          setSettingsSource("preview");
          setActiveTab("settings");
        }, "forward")
      }
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border-white/10 bg-black/40 text-white/90 active:scale-[0.98]"
    >
      ✎
    </button>
  </div>

</div>

    {/* Day Selector */}
    <div className="flex gap-2 mb-4 overflow-x-auto">
     {currentRoutine?.days?.map((day, index) => (
      <button
       key={index}
       onClick={() => setSelectedDay(index)}
       className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.98] ${
         index === selectedDay
          ? "bg-[#c7a86a] text-black"
          : "bg-black/40 text-white border border-white/10"
          }`}
        >
         {day.name}
       </button>
     ))}
    </div>



{/* EXERCISE CARDS */}
<div className="space-y-5 pb-24">
  {currentDay?.exercises?.map((exercise, i) => (
    <div
      key={i}
      onClick={() =>
        setExpandedExerciseIndex(
          expandedExerciseIndex === i ? null : i
        )
      }
      className="relative rounded-3xl border border-[#c7a86a40] bg-black/40 backdrop-blur-md overflow-hidden shadow-[0_0_25px_rgba(199,168,106,0.15)] cursor-pointer transition-all duration-200 active:scale-[0.98]"
    >
      {/* IMAGE */}
     <div
      className={`absolute right-0 top-0 h-full flex items-center justify-center border border-white/20 transition-all duration-300 ${
        expandedExerciseIndex === i ? "w-[40%]" : "w-[28%]"
        }`}
        >
          <div className="text-white/30 text-xs">image</div>
      </div>

      {/* CONTENT */}
      <div
      className={`relative p-4 transition-all duration-300 ${
        expandedExerciseIndex === i ? "pr-[42%]" : "pr-[30%]"
        }`}
        >

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-[#c7a86a60] text-sm text-[#d7c7a4]">
            {i + 1}
          </div>

          <div className="text-white font-medium text-sm">
            {exercise.name}
          </div>
        </div>

        {/* ✅ EXPANDED SETS — INSIDE MAP */}
        <div
  className={`transition-all duration-300 overflow-hidden ${
    expandedExerciseIndex === i
      ? "max-h-[200px] opacity-100 mt-4"
      : "max-h-0 opacity-0"
  }`}
>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {exercise.sets.slice(0, 4).map((set, idx) => (
              <div
              key={idx}
              className="rounded-md px-2 py-2 text-center w-full"
              >
                <div className="text-white/40 text-[9px] uppercase">
                {`Set ${idx + 1}`}
                </div>
                <div className="text-white text-xs font-semibold">
                  {set.weight || "-"} × {set.reps || "-"}
                </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 space-y-3">

  {/* Resume Button */}
  {(() => {
  const saved = JSON.parse(localStorage.getItem("active-workout-state") || "null");
  return saved?.isPaused === true;
})() && (
    <button
    onClick={() => {
  const saved = JSON.parse(
    localStorage.getItem("active-workout-state")
  );

  if (!saved || saved.activeExerciseIndex === undefined) return;

  // restore
  setSelectedRoutine(saved.selectedRoutine || 0);
  setSelectedDay(saved.selectedDay || 0);

  setActiveExerciseIndex(saved.activeExerciseIndex || 0);
  setActiveSetIndex(saved.activeSetIndex || 0);
  setWorkoutSeconds(Number(saved.workoutSeconds) || 0);
  setRestSeconds(saved.restSeconds || 0);

  setRestPaused(false);
  setActiveTab("workout");
  setWorkoutMode(true);

  // THEN clear UI state
  setHasPausedWorkout(false);
}}
      className="w-full rounded-2xl p-4 text-sm font-semibold bg-green-600 text-white"
    >
      Resume Workout
    </button>
  )}

  {/* Start Fresh */}
  <button
    onClick={startWorkout}
    className="w-full rounded-2xl p-4 text-sm font-semibold bg-gradient-to-r from-[#c7a86a]/70 to-[#d7c7a4]/70 text-black shadow-[0_0_30px_rgba(199,168,106,0.5)] transition-all duration-150 active:scale-[0.97]"
  >
    Start Workout
  </button>

</div>

  </>
);
}