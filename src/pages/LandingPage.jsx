import {
  ChartNoAxesCombined,
  Dumbbell,
  History,
  Images,
  PersonStanding,
  Settings,
} from "lucide-react";
import landingBg from "../landing-bg.png";

const baseBtn =
  "rounded-xl flex items-center justify-center border backdrop-blur-sm bg-black/35 active:scale-95 transition-all";

export default function LandingPage({
  setActiveTab,
  setActiveScreen,
  setSettingsSource,
  startStretchOnly,
}) {
  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <div className="relative min-h-0 flex-1">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${landingBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
          }}
        />

        <div className="absolute left-0 top-0 z-10 flex flex-col gap-2 pt-[max(0.85rem,env(safe-area-inset-top))] pl-[max(0.85rem,env(safe-area-inset-left))]">
          <button
            type="button"
            aria-label="Exercise Repo"
            title="Exercise Repo"
            onClick={() => {
              window.history.pushState({ screen: "app" }, "");
              setActiveTab("repo");
              setActiveScreen("app");
            }}
            className={`${baseBtn} h-11 w-11 border-amber-400/45 text-[#d7c7a4]`}
          >
            <Images size={16} strokeWidth={1.6} />
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
            className={`${baseBtn} h-11 w-11 border-emerald-400/45 text-[#d7c7a4]`}
          >
            <ChartNoAxesCombined size={16} strokeWidth={1.6} />
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
            className={`${baseBtn} h-11 w-11 border-stone-400/40 text-[#d7c7a4]`}
          >
            <Settings size={16} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div className="relative z-10 shrink-0 bg-black/80 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-[2px]">
        <div className="mx-auto flex w-full max-w-md items-end justify-center gap-4 px-4 animate-[fadeIn_0.7s_ease_forwards] sm:gap-5">
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
            className={`${baseBtn} h-16 w-16 border-sky-400/50 text-[#d7c7a4]`}
          >
            <PersonStanding size={26} strokeWidth={1.7} />
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
            className={`${baseBtn} h-16 w-36 rounded-2xl border-2 border-[#c7a86a] text-[#d7c7a4] shadow-[0_0_28px_rgba(199,168,106,0.22)] sm:w-40`}
          >
            <Dumbbell size={32} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            aria-label="History"
            title="History"
            onClick={() => {
              window.history.pushState({ screen: "app" }, "");
              setActiveTab("history");
              setActiveScreen("app");
            }}
            className={`${baseBtn} h-16 w-16 border-violet-400/45 text-[#d7c7a4]`}
          >
            <History size={26} strokeWidth={1.7} />
          </button>
        </div>
      </div>
    </div>
  );
}
