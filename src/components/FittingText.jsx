import React from "react";

/**
 * Shrinks text to fit a container (readable floor), wrapping up to maxLines.
 */
export default function FittingText({
  text,
  className = "",
  maxSize = 18,
  minSize = 12,
  maxLines = 2,
  lineHeight = 1.25,
}) {
  const ref = React.useRef(null);
  const [fontSize, setFontSize] = React.useState(maxSize);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      let low = minSize;
      let high = maxSize;
      let best = minSize;

      while (high - low > 0.25) {
        const mid = (low + high) / 2;
        el.style.fontSize = `${mid}px`;
        el.style.lineHeight = String(lineHeight);
        el.style.maxHeight = `${mid * lineHeight * maxLines}px`;

        const overflows =
          el.scrollHeight > el.clientHeight + 1 ||
          el.scrollWidth > el.clientWidth + 1;

        if (overflows) {
          high = mid;
        } else {
          best = mid;
          low = mid;
        }
      }

      el.style.fontSize = `${best}px`;
      el.style.maxHeight = `${best * lineHeight * maxLines}px`;
      setFontSize(best);
    };

    fit();

    const ro = new ResizeObserver(fit);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [text, maxSize, minSize, maxLines, lineHeight]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        fontSize,
        lineHeight,
        maxHeight: `${fontSize * lineHeight * maxLines}px`,
        overflow: "hidden",
        wordBreak: "break-word",
      }}
    >
      {text}
    </div>
  );
}

/** Keep a single-line input fully visible by shrinking its font. */
export function useFittingInputFont(value, { maxSize = 14, minSize = 11 } = {}) {
  const ref = React.useRef(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      let size = maxSize;
      el.style.fontSize = `${size}px`;
      while (size > minSize && el.scrollWidth > el.clientWidth + 1) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [value, maxSize, minSize]);

  return ref;
}
