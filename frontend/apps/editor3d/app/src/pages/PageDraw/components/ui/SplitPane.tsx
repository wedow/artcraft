import {
  useRef,
  useState,
  useCallback,
  ReactNode,
  CSSProperties,
} from "react";

export type SplitPaneProps = {
  /** What should appear in the left pane */
  left: ReactNode;
  /** What should appear in the right pane */
  right: ReactNode;
  /** Starting width of the left pane (in %), default = 50 % */
  initialPercent?: number;
  /** Smallest allowed left-pane width, default = 15 % */
  minPercent?: number;
  /** Largest allowed left-pane width, default = 85 % */
  maxPercent?: number;
  /** Fires on every drag with the new % */
  onChange?: (percent: number) => void;
  /** Extra classes for the outer wrapper */
  className?: string;
};

export default function SplitPane({
  left,
  right,
  initialPercent = 50,
  minPercent = 15,
  maxPercent = 85,
  onChange,
  className = "",
}: SplitPaneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(initialPercent);

  /** Same logic for mouse + touch */
  const beginDrag = useCallback(() => {
    const move = (clientX: number) => {
      const { left: rootLeft, width } = rootRef.current!.getBoundingClientRect();
      const pct = ((clientX - rootLeft) / width) * 100;
      const clamped = Math.min(maxPercent, Math.max(minPercent, pct));
      setLeftPct(clamped);
      onChange?.(clamped);
    };

    const handleMove = (e: MouseEvent | TouchEvent) =>
      move(e instanceof MouseEvent ? e.clientX : e.touches[0].clientX);

    /* attach & clean up */
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });

    const endDrag = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchend", endDrag);
    };

    window.addEventListener("mouseup", endDrag, { once: true });
    window.addEventListener("touchend", endDrag, { once: true });
  }, [minPercent, maxPercent, onChange]);
  /* Tailwind handles almost all the styling—only flex-basis is inline */
  const leftStyle: CSSProperties = { flexBasis: `${leftPct}%`};

  return (
    <div
      ref={rootRef}
      className={`pegboard-bg flex h-screen w-full overflow-hidden relative ${className}`}
    >
      <div style={leftStyle} className="h-full overflow-hidden min-w-0">{left}</div>

      <div
        className="w-1 bg-gray-500/80 hover:bg-gray-600 transition
                   cursor-col-resize select-none"
        onMouseDown={beginDrag}
        onTouchStart={beginDrag}
      />

      <div className="flex-1 h-full overflow-hidden">{right}</div>
    </div>
  );
}