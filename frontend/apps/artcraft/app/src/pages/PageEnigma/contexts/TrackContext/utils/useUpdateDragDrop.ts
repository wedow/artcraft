import { useCallback } from "react";

export default function useUpdateDragDrop() {
  const startDrag = useCallback(() => {}, []);

  const endDrag = useCallback(() => {}, []);

  return {
    startDrag,
    endDrag,
  };
}
