import {
  ChartNoAxesCombined,
  Dumbbell,
  History,
  PersonStanding,
  Settings,
} from "lucide-react";
import landingBg from "../landing-bg.png";

const baseBtn =
  "rounded-lg flex items-center justify-center border backdrop-blur-sm bg-black/35 active:scale-95 transition-all";
const iconProps = { size: 16, strokeWidth: 1.6 };

export default function LandingPage({
  setActiveTab,
  setActiveScreen,
  setSettingsSource,
  startStretchOnly,
}) {
  return (
    <div
      className="fixed inset-0 flex items-end justify-center pb-4"
      style={{
        backgroundImage: `url(${landingBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center 28%",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex items-center gap-5 animate-[fadeIn_0.7s_ease_forwards]">
        <button
          type="button"
          aria-label="History"
          title="History"
          onClick={() => {
            window.history.pushState({ screen: "app" }, "");
            setActiveTab("history");
            setActiveScreen("app");
          }}
          className={`${baseBtn} w-9 h-9 border-violet-400/45 text-[#d7c7a4]`}
        >
          <History {...iconProps} />
        </button>

        <button
          type="button"
          aria-label="Stretch"
          title="Stretch"
          onClick={() => {
            window.history.pushState({ screen: "app" }, "");
            if (typeof startStretchOnly === "function") {
              startStretchOnly();
            }
          }}
          className={`${baseBtn} w-9 h-9 border-sky-400/50 text-[#d7c7a4]`}
        >
          <PersonStanding {...iconProps} />
        </button>

        <button
          type="button"
          aria-label="Workout"
          title="Workout"
          onClick={() => {
            window.history.pushState({ screen: "app" }, "");
            setActiveTab("workout");
            setActiveScreen("app");
          }}
          className={`${baseBtn} w-12 h-12 rounded-xl border-2 border-[#c7a86a] text-[#d7c7a4]`}
        >
          <Dumbbell size={22} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          aria-label="Analytics"
          title="Analytics"
          onClick={() => {
            window.history.pushState({ screen: "app" }, "");
            setActiveTab("analytics");
            setActiveScreen("app");
          }}
          className={`${baseBtn} w-9 h-9 border-emerald-400/45 text-[#d7c7a4]`}
        >
          <ChartNoAxesCombined {...iconProps} />
        </button>

        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          onClick={() => {
            window.history.pushState({ screen: "app" }, "");

            if (setSettingsSource) {
              setSettingsSource("landing");
            }

            setActiveTab("settings");
            setActiveScreen("app");
          }}
          className={`${baseBtn} w-9 h-9 border-stone-400/40 text-[#d7c7a4]`}
        >
          <Settings {...iconProps} />
        </button>
      </div>
    </div>
  );
}
