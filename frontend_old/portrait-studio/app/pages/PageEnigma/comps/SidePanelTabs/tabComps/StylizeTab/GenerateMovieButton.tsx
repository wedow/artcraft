import { useSignals } from "@preact/signals-react/runtime";

import { useEffect, useRef } from "react";
import { StyleButtons } from "./StyleButtons";

interface GenerateMovieButtonProps {
  setGenerateSectionHeight: (height: number) => void;
}

export function GenerateMovieButton({
  setGenerateSectionHeight,
}: GenerateMovieButtonProps) {
  useSignals();
  const ref = useRef<HTMLDivElement>(null);

  // Resizes Height of Generate Movie Section that's at the bottom dynamically if squeezed
  useEffect(() => {
    const currentElement = ref.current;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (target) {
          const height = target.offsetHeight;
          setGenerateSectionHeight(height);
        }
      }
    });

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className="absolute bottom-0 w-full border-t border-[#3F3F3F] bg-ui-controls/60 p-5 shadow-lg"
    >
      <StyleButtons />
    </div>
  );
}
