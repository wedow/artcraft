import { GalleryItem } from "./gallery-modal";
import { useGalleryModalStore } from "./galleryModalStore";

interface DragState {
  item: GalleryItem | null;
  isDragging: boolean;
  startX: number;
  startY: number;
  currX: number;
  currY: number;
}

const dragState: DragState = {
  item: null,
  isDragging: false,
  startX: 0,
  startY: 0,
  currX: 0,
  currY: 0,
};

const dragThreshold = 5;

function onPointerDown(event: React.PointerEvent, item: GalleryItem) {
  if (event.button !== 0) return;
  dragState.item = item;
  dragState.startX = event.pageX;
  dragState.startY = event.pageY;
  dragState.currX = event.pageX;
  dragState.currY = event.pageY;
  dragState.isDragging = false;
  useGalleryModalStore.setState({ visibleDuringDrag: false });
  document.body.style.cursor = "grabbing";
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(event: PointerEvent) {
  if (!dragState.item) return;
  const deltaX = event.pageX - dragState.startX;
  const deltaY = event.pageY - dragState.startY;
  if (
    !dragState.isDragging &&
    (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)
  ) {
    dragState.isDragging = true;
  }
  dragState.currX = event.pageX;
  dragState.currY = event.pageY;
}

export const IMAGE_DROP_EVENT = "gallery-image-drop";
export const SHAPE_DROP_EVENT = "gallery-shape-drop";

export function emitImageDrop(
  item: GalleryItem,
  position: { x: number; y: number }
) {
  window.dispatchEvent(
    new CustomEvent(IMAGE_DROP_EVENT, { detail: { item, position } })
  );
}

export function emitShapeDrop(
  item: GalleryItem,
  position: { x: number; y: number }
) {
  window.dispatchEvent(
    new CustomEvent(SHAPE_DROP_EVENT, { detail: { item, position } })
  );
}

export function onImageDrop(
  callback: (item: GalleryItem, position: { x: number; y: number }) => void
) {
  const handler = (e: any) => {
    callback(e.detail.item, e.detail.position);
  };
  window.addEventListener(IMAGE_DROP_EVENT, handler);
  return handler;
}

export function onShapeDrop(
  callback: (item: GalleryItem, position: { x: number; y: number }) => void
) {
  const handler = (e: any) => {
    callback(e.detail.item, e.detail.position);
  };
  window.addEventListener(SHAPE_DROP_EVENT, handler);
  return handler;
}

export function removeImageDropListener(handler: (e: any) => void) {
  window.removeEventListener(IMAGE_DROP_EVENT, handler);
}

export function removeShapeDropListener(handler: (e: any) => void) {
  window.removeEventListener(SHAPE_DROP_EVENT, handler);
}

function onPointerUp(event: PointerEvent) {
  if (dragState.item && dragState.isDragging) {
    if (dragState.item.assetType === "shape") {
      emitShapeDrop(dragState.item, { x: event.pageX, y: event.pageY });
    } else if (
      dragState.item.mediaClass === "image" ||
      dragState.item.mediaClass === "dimensional"
    ) {
      emitImageDrop(dragState.item, { x: event.pageX, y: event.pageY });
    }
  }

  dragState.item = null;
  dragState.isDragging = false;
  const { reopenAfterDrag } = useGalleryModalStore.getState();
  useGalleryModalStore.setState({ visibleDuringDrag: reopenAfterDrag });
  document.body.style.cursor = "";
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
}

function getDragState() {
  return dragState;
}

const galleryDnd = {
  onPointerDown,
  getDragState,
};

export default galleryDnd;
