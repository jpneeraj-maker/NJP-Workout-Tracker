import { useEffect, useRef, useState } from "react";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 1;

function nearestIndex(values, value) {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const exact = values.findIndex((v) => String(v) === raw);
  if (exact >= 0) return exact;

  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return 0;

  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < values.length; i += 1) {
    const dist = Math.abs(Number(values[i]) - numeric);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export default function WheelDial({
  values,
  value,
  onChange,
  unit = "",
  className = "",
}) {
  const scrollerRef = useRef(null);
  const frameRef = useRef(0);
  const settlingRef = useRef(false);
  const lastEmittedRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(() =>
    nearestIndex(values, value)
  );

  const pad = Math.floor(VISIBLE_ITEMS / 2);
  const height = ITEM_HEIGHT * VISIBLE_ITEMS;

  useEffect(() => {
    const index = nearestIndex(values, value);
    const next = String(values[index] ?? "");
    setSelectedIndex(index);

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const top = index * ITEM_HEIGHT;
    const alreadyThere = Math.abs(scroller.scrollTop - top) <= 1;

    if (alreadyThere) {
      lastEmittedRef.current = next;
      return;
    }

    // Don't fight the user's active scroll for values we just emitted.
    if (next === lastEmittedRef.current) return;

    lastEmittedRef.current = next;
    settlingRef.current = true;
    scroller.scrollTop = top;
    requestAnimationFrame(() => {
      settlingRef.current = false;
    });
  }, [value, values]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const syncFromScroll = (shouldEmit) => {
    const scroller = scrollerRef.current;
    if (!scroller || settlingRef.current) return;

    const index = Math.min(
      values.length - 1,
      Math.max(0, Math.round(scroller.scrollTop / ITEM_HEIGHT))
    );

    setSelectedIndex(index);

    if (!shouldEmit) return;

    const next = String(values[index] ?? "");
    if (next === lastEmittedRef.current) return;
    lastEmittedRef.current = next;
    onChange?.(next);
  };

  const handleScroll = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => syncFromScroll(true));
  };

  const handleScrollEnd = () => {
    const scroller = scrollerRef.current;
    if (!scroller || settlingRef.current) return;

    const index = Math.min(
      values.length - 1,
      Math.max(0, Math.round(scroller.scrollTop / ITEM_HEIGHT))
    );
    const top = index * ITEM_HEIGHT;
    if (Math.abs(scroller.scrollTop - top) > 0.5) {
      scroller.scrollTo({ top, behavior: "smooth" });
    }
    syncFromScroll(true);
  };

  return (
    <div className={`relative select-none ${className}`}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
        className="no-scrollbar relative z-[1] overflow-y-auto overscroll-contain"
        style={{
          height,
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {pad > 0 ? (
          <div aria-hidden style={{ height: pad * ITEM_HEIGHT }} />
        ) : null}
        {values.map((option, index) => {
          const selected = index === selectedIndex;
          return (
            <div
              key={`${option}-${index}`}
              className={`flex items-center justify-center text-center transition-colors ${
                selected
                  ? "text-xl font-semibold text-white"
                  : "text-base text-white/35"
              }`}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
              }}
            >
              {option}
            </div>
          );
        })}
        {pad > 0 ? (
          <div aria-hidden style={{ height: pad * ITEM_HEIGHT }} />
        ) : null}
      </div>

      {unit ? (
        <div className="pointer-events-none absolute right-3 top-1/2 z-[4] -translate-y-1/2 text-xs text-white/45">
          {unit}
        </div>
      ) : null}
    </div>
  );
}

export function buildWeightValues({
  min = 0,
  max = 150,
  step = 0.5,
  include = [],
} = {}) {
  const values = [];
  for (let n = min; n <= max + 1e-9; n += step) {
    const rounded = Math.round(n * 100) / 100;
    values.push(String(rounded));
  }

  for (const extra of include) {
    const raw = String(extra ?? "").trim();
    if (!raw || values.includes(raw)) continue;
    values.push(raw);
  }

  return values
    .map((v) => ({ raw: v, num: Number(v) }))
    .filter((v) => Number.isFinite(v.num))
    .sort((a, b) => a.num - b.num)
    .map((v) => v.raw);
}

export function buildRepValues({ min = 0, max = 50, include = [] } = {}) {
  const values = [];
  for (let n = min; n <= max; n += 1) values.push(String(n));

  for (const extra of include) {
    const raw = String(extra ?? "").trim();
    if (!raw || values.includes(raw)) continue;
    values.push(raw);
  }

  return values
    .map((v) => ({ raw: v, num: Number(v) }))
    .filter((v) => Number.isFinite(v.num))
    .sort((a, b) => a.num - b.num)
    .map((v) => v.raw);
}
