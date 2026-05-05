import { useState } from "react";
export default function WorkoutPreviewPage(props) {
  const {
    data,
    selectedRoutine,
    setselectedRoutine,
    selectedDay,
    setSelectedDay,
    setActiveTab,
    setSettingsSource,
    setActiveScreen,
    startWorkout
  } = props;
  console.log("Preview FULL data:", data);
  const currentRoutine = data?.routines?.[selectedRoutine];
  const currentDay = currentRoutine?.days?.[selectedDay];
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(null);
const [transitionDirection, setTransitionDirection] = useState("forward");
const [isTransitioning, setIsTransitioning] = useState(false);
function navigateWithTransition(callback, direction = "forward") {
  setTransitionDirection(direction);
  setIsTransitioning(true);

  setTimeout(() => {
    callback();
    setIsTransitioning(false);
  }, 250);
}
return (
  <>

    {/* BACK AND EDIT BUTTONS */}
<div className="mb-4 flex items-center justify-between">
  <button
    onClick={() =>
  navigateWithTransition(
    () => setActiveScreen("landing"),
    "back"
  )
}
    className="text-sm text-white/60 transition-all duration-200 active:scale-[0.98]"
  >
    ← Back
  </button>

  <button
  onClick={() =>
  navigateWithTransition(() => {
    setSettingsSource("preview");
    setActiveTab("settings");
  }, "forward")
}
    className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/90 transition-all duration-200 active:scale-[0.98]"
  >
    ✎
  </button>
</div>

    {/* ROUTINE SELECTOR */}
    <div className="flex gap-2 mb-4 overflow-x-auto">
      {Object.keys(data?.routines || {}).map((routineKey) => (
        <button
          key={routineKey}
          onClick={() => {
            setselectedRoutine(routineKey);
            setSelectedDay(0);
          }}
          className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.98] ${
            routineKey === selectedRoutine
              ? "bg-[#c7a86a] text-black"
              : "bg-black/40 text-white border border-white/10"
          }`}
        >
          {data?.routines?.[routineKey]?.name || `Routine ${Number(routineKey) + 1}`}
        </button>
      ))}
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
      <div className="absolute right-0 top-0 h-full w-[28%] flex items-center justify-center">
        <div className="text-white/30 text-xs">image</div>
      </div>

      {/* CONTENT */}
      <div className="relative p-4 pr-[30%]">

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
  <div className="flex gap-6 overflow-x-auto text-sm pb-1">
            {exercise.sets.map((set, idx) => (
              <div key={idx} className="min-w-[90px] border-r border-white/10 pr-4 last:border-none">
                <div className="text-white/50 text-[10px] uppercase tracking-wide">
                  {set.type}
                </div>
                <div className="text-white font-semibold text-sm">
                  {set.weight || "-"} x {set.reps || "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
    {/* START WORKOUT BUTTON */}
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
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