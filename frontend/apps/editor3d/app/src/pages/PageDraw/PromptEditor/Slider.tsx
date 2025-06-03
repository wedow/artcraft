// AIStrengthSlider.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AIStrengthSliderProps } from './types';

const Slider: React.FC<AIStrengthSliderProps> = ({
  value,
  onChange,
  width  = '100%',
  height = 48,
  inset  = false,
  className = '',
}) => {
  const trackRef  = useRef<HTMLDivElement>(null);
  const fillRef   = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [hover,      setHover]      = useState(false);
  const [dragging,   setDragging]   = useState(false);   // ← new

  /* ----- paint helpers ----- */
  const clamp    = (v: number) => Math.max(0, Math.min(1, v));
  const paint    = (v: number) => {
    fillRef.current!.style.transform = `scaleX(${v})`;
    handleRef.current!.style.left    = `${v * 100}%`;
  };
  useEffect(() => paint(value), [value]);

  /* ----- pointer logic ----- */
  const valAt = (x: number) => {
    const { left, width } = trackRef.current!.getBoundingClientRect();
    return clamp((x - left) / width);
  };

  const start = (e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const v = valAt(e.clientX);
    paint(v);
    onChange(v);
  };

  const move  = (e: PointerEvent) => {
    if (!dragging) return;
    const v = valAt(e.clientX);
    paint(v);
    onChange(v);                         // fine to call every frame now
  };

  const stop  = () => setDragging(false);

  useEffect(() => {
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup',   stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup',   stop);
    };
  }, [dragging]);

  /* ----- derived sizes ----- */
  const trackH = typeof height === 'number' ? `${height}px` : height;

  /* ----- render ----- */
  const showHandle = hover || dragging;
  
  return (
    <div className="relative select-none" style={{ width }}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        onPointerDown={start}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`
          group flex items-center rounded-xl cursor-pointer overflow-hidden
          bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors relative
          ${inset ? 'shadow-inner' : ''}
          ${className}
        `}
        style={{ height: trackH }}
      >
        {/* fill */}
        <div
          ref={fillRef}
          className="absolute inset-0 bg-white/15 will-change-transform"
          style={{ transformOrigin: 'left' }}
        />

        {/* handle — visible only on hover OR drag */}
        <div
          ref={handleRef}
          className={`
            absolute  translate-x-1/2 bg-white will-change-transform
            transition-opacity duration-150
            ${showHandle ? 'opacity-100' : 'opacity-50'}
          `}
          style={{ width: '1px', height: '60%' }}
        />


   
      {/* left-aligned, vertically centred label */}
     <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#ACACAC]">
         AI Strength
      </span>
        {/* percentage on hover */}
        <span className="
          absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white
          opacity-0 group-hover:opacity-100 transition-opacity
          min-w-[40px] text-right
        ">
          {Math.round(value * 100)}
        </span>
      </div>
    </div>
  );
};

export default Slider;
