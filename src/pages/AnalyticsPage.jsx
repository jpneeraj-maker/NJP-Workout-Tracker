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

const GOLD = "#c7a86a";
const GOLD_SOFT = "#d7c7a4";

function StatCard({ label, value, hint, accent = "text-white" }) {
  return (
    <div className="rounded-2xl border border-[#c7a86a40] bg-black/45 backdrop-blur-md px-3 py-3 min-w-0">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#d7c7a4]/80 mb-1 truncate">
        {label}
      </div>
      <div className={`text-xl font-semibold tabular-nums ${accent}`}>{value}</div>
      {hint ? (
        <div className="text-[11px] text-white/45 mt-0.5 truncate">{hint}</div>
      ) : null}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#c7a86a55] bg-black/90 px-2.5 py-1.5 text-xs text-[#d7c7a4] shadow-lg">
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
      <div className="pt-4 mb-3 relative flex items-center justify-center">
        <div className="absolute left-0">
          <button
            onClick={() => {
              window.history.pushState({}, "");
              setActiveScreen("landing");
            }}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-black/35 backdrop-blur-sm text-[#d7c7a4] border border-[#c7a86a55] hover:bg-black/50 active:scale-[0.97] transition"
          >
            <ArrowLeft size={14} />
          </button>
        </div>

        <div className="text-center">
          <div className="text-xl font-semibold text-white flex items-center justify-center gap-2">
            <ChartNoAxesCombined size={18} className="text-[#c7a86a]" />
            Analytics
          </div>
          <div className="text-[11px] text-[#d7c7a4]/70 mt-0.5">
            {stats.range.label}
          </div>
        </div>

        <div className="absolute right-0">
          <button
            onClick={() => {
              if (typeof setActiveTab === "function") {
                setActiveTab("history");
              }
            }}
            className="px-3 py-2 rounded-lg bg-black/35 backdrop-blur-sm text-[#d7c7a4] border border-[#c7a86a55] text-xs uppercase tracking-[0.14em] active:scale-[0.97] transition"
          >
            History
          </button>
        </div>
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
                  ? "bg-[#c7a86a22] border-[#c7a86a88] text-[#d7c7a4]"
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
          accent="text-[#d7c7a4]"
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
        <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-[#c7a86a40] bg-black/55 backdrop-blur-md px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-[#d7c7a4]">
          <span>
            <span className="font-semibold text-emerald-300">{stats.rest}</span>{" "}
            rest
          </span>
          <span className="text-[#c7a86a66]">·</span>
          <span>
            <span className="font-semibold text-sky-300">{stats.stretch}</span>{" "}
            stretch
          </span>
          <span className="text-[#c7a86a66]">·</span>
          <span>
            <span className="font-semibold text-white">
              {stats.sessionsPerWeek}
            </span>{" "}
            / wk
          </span>
          {stats.hitRate !== null ? (
            <>
              <span className="text-[#c7a86a66]">·</span>
              <span>
                <span className="font-semibold text-white">{stats.hitRate}%</span>{" "}
                targets
              </span>
            </>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-[#c7a86a55] bg-black/40 backdrop-blur-md p-4 mb-4 shadow-lg shadow-black/40">
        <div className="text-sm font-medium text-[#d7c7a4] mb-3">
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
                  tick={{ fill: GOLD_SOFT, fontSize: 10 }}
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
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(199,168,106,0.08)" }} />
                <Bar
                  dataKey="sessions"
                  name="Sessions"
                  fill={GOLD}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {splitRows.length > 0 ? (
        <section className="rounded-2xl border border-[#c7a86a40] bg-black/40 backdrop-blur-md p-4 mb-4">
          <div className="text-sm font-medium text-[#d7c7a4] mb-3">
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
                      className="h-full rounded-full bg-[#c7a86a]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-6 text-right tabular-nums text-[#d7c7a4]">
                    {row.count}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#c7a86a55] bg-black/40 backdrop-blur-md p-4 mb-4 shadow-lg shadow-black/40">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-sm font-medium text-[#d7c7a4]">
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
                        ? "border-[#c7a86a88] bg-[#c7a86a18] text-[#d7c7a4]"
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
                      tick={{ fill: GOLD_SOFT, fontSize: 10 }}
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
                      stroke={GOLD}
                      strokeWidth={2}
                      dot={{ r: 3, fill: GOLD }}
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
        <section className="rounded-2xl border border-[#c7a86a40] bg-black/40 backdrop-blur-md p-4 mb-4">
          <div className="text-sm font-medium text-[#d7c7a4] mb-3">
            Period bests
          </div>
          <div className="space-y-2">
            {stats.prs.map((pr) => (
              <div
                key={`${pr.name}-${pr.date}`}
                className="flex items-center justify-between gap-3 text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-white truncate">{pr.name}</div>
                  <div className="text-[11px] text-white/40">{pr.date}</div>
                </div>
                <div className="text-[#d7c7a4] font-medium tabular-nums shrink-0">
                  {pr.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#c7a86a40] bg-black/40 backdrop-blur-md p-4 mb-8">
        <div className="text-sm font-medium text-[#d7c7a4] mb-3">Insights</div>
        <ul className="space-y-2">
          {stats.insights.map((line) => (
            <li
              key={line}
              className="text-sm text-white/75 leading-relaxed pl-3 border-l-2 border-[#c7a86a66]"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
