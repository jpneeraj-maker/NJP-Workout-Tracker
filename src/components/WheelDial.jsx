import { useEffect, useRef, useState } from "react";

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 3;
const SETTLE_MS = 90;

function nearestIndex(values, value) {
  const raw = String(value ?? "").trim();
  if (!raw && values.includes("")) {
    return values.findIndex((v) => String(v) === "");
  }
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

function clampIndex(index, length) {
  if (length <= 0) return 0;
  return Math.min(length - 1, Math.max(0, index));
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
  const settleTimerRef = useRef(0);
  const settlingRef = useRef(false);
  const draggingRef = useRef(false);
  const lastEmittedRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(() =>
    nearestIndex(values, value)
  );

  const pad = Math.floor(VISIBLE_ITEMS / 2);
  const height = ITEM_HEIGHT * VISIBLE_ITEMS;

  const scrollToIndex = (index, behavior = "auto") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const top = clampIndex(index, values.length) * ITEM_HEIGHT;
    if (behavior === "smooth") {
      scroller.scrollTo({ top, behavior: "smooth" });
    } else {
      scroller.scrollTop = top;
    }
  };

  useEffect(() => {
    const index = nearestIndex(values, value);
    const next = String(values[index] ?? "");
    setSelectedIndex(index);

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const top = index * ITEM_HEIGHT;
    const alreadyThere = Math.abs(scroller.scrollTop - top) <= 1.5;

    if (alreadyThere) {
      lastEmittedRef.current = next;
      return;
    }

    // Don't fight an in-progress user gesture for a value we just emitted.
    if (draggingRef.current || next === lastEmittedRef.current) return;

    lastEmittedRef.current = next;
    settlingRef.current = true;
    scrollToIndex(index, "auto");
    requestAnimationFrame(() => {
      settlingRef.current = false;
    });
  }, [value, values]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  const readIndex = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return 0;
    return clampIndex(
      Math.round(scroller.scrollTop / ITEM_HEIGHT),
      values.length
    );
  };

  const emitIndex = (index) => {
    const next = String(values[index] ?? "");
    if (next === lastEmittedRef.current) return;
    lastEmittedRef.current = next;
    onChange?.(next);
  };

  const settleToNearest = () => {
    const scroller = scrollerRef.current;
    if (!scroller || settlingRef.current) return;

    const index = readIndex();
    const top = index * ITEM_HEIGHT;
    setSelectedIndex(index);

    if (Math.abs(scroller.scrollTop - top) > 0.75) {
      settlingRef.current = true;
      scroller.scrollTo({ top, behavior: "smooth" });
      window.setTimeout(() => {
        settlingRef.current = false;
        emitIndex(index);
      }, 140);
      return;
    }

    emitIndex(index);
  };

  const syncFromScroll = () => {
    if (settlingRef.current) return;
    const index = readIndex();
    setSelectedIndex(index);
  };

  const handleScroll = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(syncFromScroll);

    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      if (draggingRef.current) return;
      settleToNearest();
    }, SETTLE_MS);
  };

  const handleGestureStart = () => {
    draggingRef.current = true;
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
  };

  const handleGestureEnd = () => {
    draggingRef.current = false;
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      settleToNearest();
    }, SETTLE_MS);
  };

  return (
    <div className={`relative select-none ${className}`}>
      <div
        className="pointer-events-none absolute inset-x-1 top-1/2 z-[2] h-9 -translate-y-1/2 rounded-lg border border-white/10 bg-white/[0.06]"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-5 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-5 bg-gradient-to-t from-black/70 to-transparent" />

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onTouchStart={handleGestureStart}
        onTouchEnd={handleGestureEnd}
        onTouchCancel={handleGestureEnd}
        onMouseDown={handleGestureStart}
        onMouseUp={handleGestureEnd}
        onMouseLeave={() => {
          if (!draggingRef.current) return;
          handleGestureEnd();
        }}
        onWheel={() => {
          draggingRef.current = true;
          if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
          settleTimerRef.current = window.setTimeout(() => {
            draggingRef.current = false;
            settleToNearest();
          }, SETTLE_MS + 40);
        }}
        className="no-scrollbar relative z-[1] overflow-y-auto overscroll-contain"
        style={{
          height,
          scrollSnapType: "y proximity",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        }}
      >
        <div aria-hidden style={{ height: pad * ITEM_HEIGHT }} />
        {values.map((option, index) => {
          const distance = Math.abs(index - selectedIndex);
          const selected = distance === 0;
          const nearby = distance === 1;
          const label = option === "" ? "—" : option;

          return (
            <div
              key={`${option}-${index}`}
              className="flex items-center justify-center text-center"
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
                scrollSnapStop: "normal",
                opacity: selected ? 1 : nearby ? 0.48 : 0.22,
                transform: selected
                  ? "scale(1)"
                  : nearby
                    ? "scale(0.92)"
                    : "scale(0.84)",
                transition:
                  "opacity 120ms ease-out, transform 120ms ease-out, color 120ms ease-out",
                color: selected
                  ? "rgba(255,255,255,1)"
                  : nearby
                    ? "rgba(255,255,255,0.55)"
                    : "rgba(255,255,255,0.28)",
                fontSize: selected ? "1.15rem" : nearby ? "0.95rem" : "0.85rem",
                fontWeight: selected ? 600 : 500,
              }}
            >
              {label}
            </div>
          );
        })}
        <div aria-hidden style={{ height: pad * ITEM_HEIGHT }} />
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
