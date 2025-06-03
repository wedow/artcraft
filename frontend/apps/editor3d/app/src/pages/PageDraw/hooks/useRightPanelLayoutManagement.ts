import { useState,useLayoutEffect } from 'react';

export const useRightPanelLayoutManagement = (
    rightCointainerRef: React.RefObject<HTMLDivElement>,
    naturalWidth: number,
    naturalHeight: number,
    leftPct: number,
    onCanvasSizeChange?: (width: number, height: number) => void,
  ) => {
    const [previewScale, setPreviewScale] = useState(1);

    useLayoutEffect(() => {
      const update = () => {
        if (!rightCointainerRef.current) return;
        const { clientWidth, clientHeight } = rightCointainerRef.current;
        let s = Math.min(clientWidth / naturalWidth, clientHeight / naturalHeight);
        if (s > 1.0) {
          s = 1.0;
        }
        setPreviewScale(s);
        onCanvasSizeChange?.(clientWidth, clientHeight);
      };
      update();                           // run once
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }, [leftPct]);

    return previewScale;
  };
