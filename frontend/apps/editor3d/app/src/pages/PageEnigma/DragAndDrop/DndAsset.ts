import React from "react";
import { MediaItem } from "~/pages/PageEnigma/models";
import {
  addCharacter,
  addCharacterAnimation,
  addCharacterAudio,
  addCharacterExpression,
  addGlobalAudio,
  addObject,
  canDrop,
  currPosition,
  dragItem,
  overTimeline,
  timelineHeight,
  assetModalVisibleDuringDrag,
  reopenAfterDragSignal,
} from "~/pages/PageEnigma/signals";
import { pageHeight, pageWidth } from "~/signals";
import { addShape } from "~/pages/PageEnigma/signals/shape";
import { AssetType } from "~/enums";

class DndAsset {
  public dropId: string = "";
  public overElement: DOMRect | null = null;
  public dropOffset = 0;
  public initX = 0;
  public initY = 0;
  public notDropText = "";
  public isDragging: boolean = false;
  public dragThreshold: number = 5;

  constructor() {
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  onPointerDown(event: React.PointerEvent<HTMLDivElement>, item: MediaItem) {
    if (event.button === 0) {
      dragItem.value = item;
      currPosition.value = {
        currX: event.pageX,
        currY: event.pageY,
      };
      this.initX = event.pageX;
      this.initY = event.pageY;
      this.isDragging = false;
      canDrop.value = false;
      this.notDropText = "";
      assetModalVisibleDuringDrag.value = false;
      window.addEventListener("pointerup", this.onPointerUp);
      window.addEventListener("pointermove", this.onPointerMove);
    }
  }

  endDrag() {
    if (dragItem.value) {
      dragItem.value = null;
      canDrop.value = false;
      this.overElement = null;
      overTimeline.value = false;
      this.notDropText = "";
      assetModalVisibleDuringDrag.value = reopenAfterDragSignal.value;
    }
  }

  overCanvas(positionX: number, positionY: number) {
    if (positionY < 69) {
      return false;
    }
    if (positionY > pageHeight.value) {
      return false;
    }
    return positionX <= pageWidth.value;
  }

  onPointerUp(event: PointerEvent) {
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointermove", this.onPointerMove);

    if (!this.isDragging) {
      // It's a click, not a drag
      assetModalVisibleDuringDrag.value = true;
      dragItem.value = null;
      currPosition.value = { currX: 0, currY: 0 };
      return;
    }

    if (dragItem.value) {
      const positionX = event.pageX;
      const positionY = event.pageY;
      if (this.overCanvas(positionX, positionY)) {
        const mediaItem = dragItem.value;
        if (mediaItem.type === AssetType.CHARACTER) {
          addCharacter(dragItem.value);
        }
        // if (dragItem.value.type === AssetType.CAMERA) {
        //   console.log("Dragged In Camera Type")
        // }
        /*
         FIXME:
         THIS IS A TEMPARARY SOLUTION TO A LONG PROBLEM WITH SKYBOXES
         UPDATE THIS WHEN UPLOADING SKYBOXES ARE FULLY IMPLEMENTED.
         THIS IS JUST TEMPARARY!!!
        */
        if (mediaItem.type === AssetType.OBJECT || mediaItem.type === AssetType.SPLAT || mediaItem.type === AssetType.SKYBOX) {
          addObject(mediaItem);
        }

        if (mediaItem.type === AssetType.SHAPE) {
          addShape(mediaItem);
        }

        this.endDrag();
        return;
      }
    }

    if (canDrop.value && dragItem.value) {
      if (dragItem.value.type === AssetType.ANIMATION) {
        addCharacterAnimation({
          dragItem: dragItem.value,
          characterId: this.dropId,
          offset: this.dropOffset,
        });
      }
      if (dragItem.value.type === AssetType.EXPRESSION) {
        addCharacterExpression({
          dragItem: dragItem.value,
          characterId: this.dropId,
          offset: this.dropOffset,
        });
      }
      if (dragItem.value.type === AssetType.AUDIO) {
        addCharacterAudio({
          dragItem: dragItem.value,
          characterId: this.dropId,
          offset: this.dropOffset,
        });
        addGlobalAudio({
          dragItem: dragItem.value,
          audioId: this.dropId,
          offset: this.dropOffset,
        });
      }
    }
    this.endDrag();
  }

  onPointerMove(event: MouseEvent) {
    if (dragItem.value) {
      event.stopPropagation();
      event.preventDefault();
      const deltaX = event.pageX - this.initX;
      const deltaY = event.pageY - this.initY;
      if (
        Math.abs(deltaX) > this.dragThreshold ||
        Math.abs(deltaY) > this.dragThreshold
      ) {
        this.isDragging = true;
      }
      currPosition.value = {
        currX: this.initX + deltaX,
        currY: this.initY + deltaY,
      };
      overTimeline.value =
        event.pageY > pageHeight.value - timelineHeight.value;
      if (this.overElement) {
        const pos = this.overElement;
        const eventY = event.pageY;
        const inHeight = eventY >= pos.top && eventY <= pos.top + pos.height;
        const eventX = event.pageX;
        const inWidth = eventX >= pos.left && eventX <= pos.left + pos.width;

        if (inHeight && inWidth) {
          return;
        }
        canDrop.value = false;
        this.dropId = "";
        this.overElement = null;
        this.notDropText = "";
      }
    }
  }
}

const dragAndDrop = new DndAsset();

export default dragAndDrop;
