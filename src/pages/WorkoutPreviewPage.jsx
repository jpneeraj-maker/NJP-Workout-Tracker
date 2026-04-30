export default function WorkoutPreviewPage(props) {
const {
  displayedNextWorkout,
  setActiveTab,
  setWorkoutMode,
  setActiveWorkoutScreen,
  setSettingsSource,
  setActiveScreen,
  startWorkout
} = props;
return (
  <>
    {/* HEADER */}
    <div className="mb-6">
      <button
        onClick={() => setActiveScreen("landing")}
        className="text-sm text-white/60 mb-3"
      >
        ← Back
      </button>

      <div className="text-3xl font-semibold text-white">
        {displayedNextWorkout?.name}
      </div>

      <div className="text-sm text-[#d7c7a4]/70 mt-1">
        {displayedNextWorkout?.exercises?.length} Exercises
      </div>
    </div>

    {/* EXERCISE CARDS */}
    <div className="space-y-5">
      {displayedNextWorkout?.exercises?.map((exercise, i) => (
        <div
          key={i}
          className="relative rounded-3xl border border-[#c7a86a40] bg-black/40 backdrop-blur-md overflow-hidden shadow-[0_0_25px_rgba(199,168,106,0.15)]"
        >
          {/* GOLD GLOW EDGE */}
          <div className="absolute inset-0 rounded-3xl border border-[#c7a86a30] pointer-events-none" />

          {/* IMAGE PLACEHOLDER (RIGHT SIDE) */}
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 flex items-center justify-center">
            <div className="text-white/20 text-xs">
              image
            </div>
          </div>

          {/* CONTENT */}
          <div className="relative p-4 pr-[45%]">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-full border border-[#c7a86a60] text-sm text-[#d7c7a4]">
                {i + 1}
              </div>

              <div>
                <div className="text-white font-medium text-sm">
                  {exercise.name}
                </div>

                {/* placeholder for muscle group */}
                <div className="text-[11px] text-[#d7c7a4]/70">
                  {/* optional later */}
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
              {/* HEADER */}
              <div className="grid grid-cols-3 text-[10px] uppercase tracking-[0.2em] text-white/40 px-3 py-2 border-b border-white/10">
                <div>Set</div>
                <div className="text-center">Weight</div>
                <div className="text-right">Reps</div>
              </div>

              {/* ROWS */}
              {exercise.sets.map((set, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 text-sm text-white px-3 py-2 border-b border-white/5 last:border-none"
                >
                  <div>{index + 1}</div>

                  <div className="text-center">
                    {set.plannedWeight || "-"} kg
                  </div>

                  <div className="text-right">
                    {set.targetReps || "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* BUTTONS */}
    <div className="mt-6 flex gap-3">
      <button
        onClick={() => {
          setSettingsSource("preview");
          setActiveTab("settings");
        }}
        className="flex-1 rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white backdrop-blur-sm"
      >
        Edit Workout
      </button>

      <button
        onClick={startWorkout}
        className="flex-1 rounded-2xl border border-[#c7a86a55] bg-black/50 p-3 text-sm text-[#d7c7a4] shadow-[0_0_12px_rgba(199,168,106,0.25)]"
      >
        Start Workout
      </button>
    </div>
  </>
);
}