import landingBg from "../landing-bg.png";
export default function LandingPage({
  setActiveTab,
  setActiveScreen,
  setSettingsSource
}) {
  return (
    <div
      className="fixed inset-0 flex items-end justify-center pb-2"
      style={{
        backgroundImage: `url(${landingBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex items-center gap-3 animate-[fadeIn_0.7s_ease_forwards]">
        <button
          onClick={() => {
            window.history.pushState({ screen: "app" }, "");
            setActiveTab("workout");
            setActiveScreen("app");
          }}
          className="px-6 py-2 min-w-[130px] rounded-lg text-sm font-light tracking-[0.28em] uppercase border border-[#c7a86a55] text-[#d7c7a4] bg-black/35 backdrop-blur-sm active:scale-95 transition-all"
        >
          Workout
        </button>

        <button
          onClick={() => {
            window.history.pushState({ screen: "app" }, "");
            setActiveTab("history");
            setActiveScreen("app");
          }}
          className="px-6 py-2 min-w-[130px] rounded-lg text-sm font-light tracking-[0.28em] uppercase border border-[#c7a86a55] text-[#d7c7a4] bg-black/35 backdrop-blur-sm active:scale-95 transition-all"
        >
          History
        </button>

        <button
onClick={() => {
  window.history.pushState({ screen: "app" }, "");

  if (setSettingsSource) {
    setSettingsSource("landing");
  }

  setActiveTab("settings");
  setActiveScreen("app");
}}
          className="w-14 h-10 rounded-lg text-base border border-[#c7a86a55] text-[#d7c7a4] bg-black/35 backdrop-blur-sm active:scale-95 transition-all"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}