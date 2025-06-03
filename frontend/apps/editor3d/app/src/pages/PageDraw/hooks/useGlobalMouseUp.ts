import { useEffect } from 'react';
// This piece of code ensures that when you are selecting or dragging and go off the stage, 
// it releases the controls mouse drag.
export const useGlobalMouseUp = (
    setIsDragging: (value: boolean) => void,
    setIsDrawing: (value: boolean) => void,
    setCurrentLineId: (value: string | null) => void,
    setIsSelecting: (value: boolean) => void,
    isSelectingRef: React.MutableRefObject<boolean>,
    setSelectionRect: (value: any) => void,
    setLastPoint: (value: { x: number, y: number } | null) => void,
    onSelectionChange?: (isSelecting: boolean) => void,
  ) => {
    useEffect(() => {
      const handleGlobalMouseUp = () => {
        // Always reset all states when mouse is released anywhere
        setIsDragging(false);
        setIsDrawing(false);
        setCurrentLineId(null);
        setIsSelecting(false);
        isSelectingRef.current = false;
        onSelectionChange?.(false);
        setSelectionRect(null);
        setLastPoint(null);
      };

    // Listen to mouseup on the entire window
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [onSelectionChange]);
}