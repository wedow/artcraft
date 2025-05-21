import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import galleryDnd from "./galleryDnd";

export const GalleryDragComponent: React.FC = () => {
  const [dragState, setDragState] = useState(galleryDnd.getDragState());

  useEffect(() => {
    let frame: number;
    function update() {
      setDragState({ ...galleryDnd.getDragState() });
      frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!dragState.isDragging || !dragState.item) return null;

  const { currX, currY, item } = dragState;
  const size = 120;
  const style: React.CSSProperties = {
    position: "fixed",
    left: currX + 1,
    top: currY - size / 2,
    zIndex: 10000,
    width: size,
    height: size,
    pointerEvents: "none",
    aspectRatio: "1 / 1",
    display: "flex",
    flexDirection: "column",
    background: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  };

  return ReactDOM.createPortal(
    <div style={style} className="absolute">
      <img
        src={item.thumbnail || item.fullImage || ""}
        alt={item.label}
        className="pointer-events-none select-none w-full h-full object-cover"
        style={{
          borderRadius: 12,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>,
    document.body
  );
};
