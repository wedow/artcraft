import { TrackContext } from "~/pages/PageEnigma/contexts/TrackContext/TrackContext";
import { ReactNode, useCallback, useMemo } from "react";
import useUpdateDragDrop from "~/pages/PageEnigma/contexts/TrackContext/utils/useUpdateDragDrop";

interface Props {
  children: ReactNode;
}

export const TrackProvider = ({ children }: Props) => {
  const { endDrag, ...dragDrop } = useUpdateDragDrop();

  // cross group functions
  const dropClip = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const values = useMemo(() => {
    return {
      ...dragDrop,
      endDrag: dropClip,
    };
  }, [dragDrop, dropClip]);

  return (
    <TrackContext.Provider value={values}>{children}</TrackContext.Provider>
  );
};
