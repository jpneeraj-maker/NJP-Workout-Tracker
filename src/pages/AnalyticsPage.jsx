import React from "react";
import { ArrowLeft, ChartNoAxesCombined } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ANALYTICS_PERIODS,
  computeAnalytics,
} from "../analytics";
import { formatDurationSeconds } from "../schema";

const ACCENT = "#34d399";
const ACCENT_SOFT = "#a7f3d0";

function StatCard({ label, value, hint, accent = "text-white" }) {
  return (
    <div className="min-w-0 rounded-2xl border border-emerald-400/30 bg-black/45 backdrop-blur-md px-3 py-3">
      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-emerald-200/70 break-words">
        {label}
      </div>
      <div
        className={`text-lg font-semibold tabular-nums sm:text-xl break-words ${accent}`}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[11px] leading-snug text-white/45 break-words">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-emerald-400/40 bg-black/90 px-2.5 py-1.5 text-xs text-emerald-100 shadow-lg">
      <div className="text-white/70 mb-0.5">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey}>
          {p.name}: <span className="text-white font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage({
  workoutHistory = [],
  setActiveScreen,
  setActiveTab,
}) {
  const [periodId, setPeriodId] = React.useState("30");
  const [selectedLift, setSelectedLift] = React.useState(null);

  const stats = React.useMemo(
    () => computeAnalytics(workoutHistory, periodId),
    [workoutHistory, periodId]
  );

  React.useEffect(() => {
    if (!stats.topLifts.length) {
      setSelectedLift(null);
      return;
    }
    if (
      !selectedLift ||
      !stats.topLifts.some((lift) => lift.name === selectedLift)
    ) {
      setSelectedLift(stats.topLifts[0].name);
    }
  }, [stats.topLifts, selectedLift]);

  const activeLift =
    stats.topLifts.find((lift) => lift.name === selectedLift) ||
    stats.topLifts[0] ||
    null;

  const splitRows = ["Push", "Pull", "Legs", "Upper", "Full", "Other"]
    .map((key) => ({ key, count: stats.split[key] || 0 }))
    .filter((row) => row.count > 0);

  const sessionsHint =
    stats.sessionsDelta === 0
      ? "same as prior"
      : stats.sessionsDelta > 0
        ? `+${stats.sessionsDelta} vs prior`
        : `${stats.sessionsDelta} vs prior`;

  return (
    <>
      <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2 pt-3">
        <button
          onClick={() => {
            window.history.pushState({}, "");
            setActiveScreen("landing");
          }}
          className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/35 backdrop-blur-sm text-emerald-200 border border-emerald-400/45 hover:bg-black/50 active:scale-[0.97] transition"
        >
          <ArrowLeft size={14} />
        </button>

        <div className="min-w-0 text-center">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold text-white sm:text-xl">
            <ChartNoAxesCombined size={18} className="shrink-0 text-emerald-400" />
            <span className="break-words">Analytics</span>
          </div>
          <div className="mt-0.5 text-[11px] text-emerald-200/70 break-words">
            {stats.range.label}
          </div>
        </div>

        <button
          onClick={() => {
            if (typeof setActiveTab === "function") {
              setActiveTab("history");
            }
          }}
          className="px-2.5 py-2 rounded-lg bg-black/35 backdrop-blur-sm text-violet-200 border border-violet-400/45 text-[10px] uppercase tracking-[0.12em] active:scale-[0.97] transition sm:px-3 sm:text-xs sm:tracking-[0.14em]"
        >
          History
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {ANALYTICS_PERIODS.map((period) => {
          const active = period.id === periodId;
          return (
            <button
              key={period.id}
              onClick={() => setPeriodId(period.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-[0.16em] border transition active:scale-95 ${
                active
                  ? "bg-emerald-500/15 border-emerald-400/70 text-emerald-100"
                  : "bg-black/30 border-white/10 text-white/55"
              }`}
            >
              {period.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <StatCard
          label="Workouts"
          value={stats.sessions}
          hint={sessionsHint}
        />
        <StatCard
          label="Streak"
          value={stats.currentStreak}
          hint={`best ${stats.longestStreak}`}
          accent="text-emerald-200"
        />
        <StatCard
          label="Volume"
          value={stats.totalVolume ? `${stats.totalVolume}` : "—"}
          hint={stats.totalVolume ? "kg × reps" : "numeric loads only"}
        />
        <StatCard
          label="Time"
          value={
            stats.totalSeconds
              ? formatDurationSeconds(stats.totalSeconds)
              : "—"
          }
          hint={
            stats.avgSeconds
              ? `avg ${formatDurationSeconds(stats.avgSeconds)}`
              : "logged duration"
          }
        />
      </div>

      <div className="mb-3 flex justify-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-emerald-400/35 bg-emerald-500/5 backdrop-blur-md px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-emerald-100/90">
          <span>
            <span className="font-semibold text-emerald-300">{stats.rest}</span>{" "}
            rest
          </span>
          <span className="text-emerald-400/45">·</span>
          <span>
            <span className="font-semibold text-sky-300">{stats.stretch}</span>{" "}
            stretch
          </span>
          <span className="text-emerald-400/45">·</span>
          <span>
            <span className="font-semibold text-white">
              {stats.sessionsPerWeek}
            </span>{" "}
            / wk
          </span>
          {stats.hitRate !== null ? (
            <>
              <span className="text-emerald-400/45">·</span>
              <span>
                <span className="font-semibold text-white">{stats.hitRate}%</span>{" "}
                targets
              </span>
            </>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-emerald-400/35 bg-black/40 backdrop-blur-md p-4 mb-4 shadow-lg shadow-emerald-950/20">
        <div className="text-sm font-medium text-emerald-100/90 mb-3">
          Weekly sessions
        </div>
        {stats.weeklyBars.length === 0 || stats.sessions === 0 ? (
          <div className="text-sm text-white/40 py-8 text-center">
            No session data in this window.
          </div>
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyBars} barSize={18}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: ACCENT_SOFT, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={24}
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(52,211,153,0.08)" }} />
                <Bar
                  dataKey="sessions"
                  name="Sessions"
                  fill={ACCENT}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {splitRows.length > 0 ? (
        <section className="rounded-2xl border border-emerald-400/30 bg-black/40 backdrop-blur-md p-4 mb-4">
          <div className="text-sm font-medium text-emerald-100/90 mb-3">
            Day-type balance
          </div>
          <div className="space-y-2">
            {splitRows.map((row) => {
              const max = Math.max(...splitRows.map((r) => r.count), 1);
              const pct = Math.round((row.count / max) * 100);
              return (
                <div key={row.key} className="flex items-center gap-3 text-sm">
                  <div className="w-12 text-white/70 shrink-0">{row.key}</div>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-right tabular-nums text-emerald-200">
                    {row.count}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-emerald-400/35 bg-black/40 backdrop-blur-md p-4 mb-4 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-sm font-medium text-emerald-100/90">
            Lift progress
          </div>
          {activeLift?.delta ? (
            <div
              className={`text-xs tabular-nums ${
                activeLift.delta > 0
                  ? "text-emerald-300"
                  : activeLift.delta < 0
                    ? "text-red-300"
                    : "text-white/40"
              }`}
            >
              {activeLift.delta > 0 ? "+" : ""}
              {activeLift.delta} kg
            </div>
          ) : null}
        </div>

        {stats.topLifts.length === 0 ? (
          <div className="text-sm text-white/40 py-6 text-center">
            Log numeric weights to see lift trends.
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
              {stats.topLifts.map((lift) => {
                const active = lift.name === activeLift?.name;
                return (
                  <button
                    key={lift.name}
                    onClick={() => setSelectedLift(lift.name)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] border transition active:scale-95 ${
                      active
                        ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-100"
                        : "border-white/10 bg-black/25 text-white/50"
                    }`}
                  >
                    {lift.name}
                  </button>
                );
              })}
            </div>

            {activeLift && activeLift.points.length > 0 ? (
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeLift.points}>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: ACCENT_SOFT, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      width={32}
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Best kg"
                      stroke={ACCENT}
                      strokeWidth={2}
                      dot={{ r: 3, fill: ACCENT }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-white/40 py-6 text-center">
                Not enough points for this lift.
              </div>
            )}
          </>
        )}
      </section>

      {stats.prs.length > 0 ? (
        <section className="rounded-2xl border border-emerald-400/30 bg-black/40 backdrop-blur-md p-4 mb-4">
          <div className="text-sm font-medium text-emerald-100/90 mb-3">
            Period bests
          </div>
          <div className="space-y-2">
            {stats.prs.map((pr) => (
              <div
                key={`${pr.name}-${pr.date}`}
                className="flex items-center justify-between gap-3 text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="break-words text-white">{pr.name}</div>
                  <div className="text-[11px] text-white/40">{pr.date}</div>
                </div>
                <div className="text-emerald-200 font-medium tabular-nums shrink-0">
                  {pr.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-6 rounded-2xl border border-emerald-400/30 bg-black/40 backdrop-blur-md p-4">
        <div className="mb-3 text-sm font-medium text-emerald-100/90">Insights</div>
        <ul className="space-y-2">
          {stats.insights.map((line) => (
            <li
              key={line}
              className="text-sm text-white/75 leading-relaxed pl-3 border-l-2 border-emerald-400/50"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
