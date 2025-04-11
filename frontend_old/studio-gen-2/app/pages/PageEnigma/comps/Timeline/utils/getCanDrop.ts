import { ClipGroup, ClipType, AssetType } from "~/enums";
import DndAsset from "~/pages/PageEnigma/DragAndDrop/DndAsset";

export function getCanDrop({
  dragType,
  type,
  group,
}: {
  dragType?: AssetType;
  type?: ClipType;
  group: ClipGroup;
}) {
  if (dragType === AssetType.ANIMATION) {
    if (type === ClipType.ANIMATION) {
      return true;
    }
    if (type === ClipType.AUDIO) {
      DndAsset.notDropText =
        "Cannot drag character animation onto vocals and speech track";
    }
    if (type === ClipType.EXPRESSION) {
      DndAsset.notDropText =
        "Cannot drag character animation onto facial expression track";
    }
    if (group === ClipGroup.GLOBAL_AUDIO) {
      DndAsset.notDropText = "Cannot drag character animation onto music track";
    }
    if (group === ClipGroup.CAMERA) {
      DndAsset.notDropText =
        "Cannot drag character animation onto camera track";
    }
  }
  if (dragType === AssetType.EXPRESSION) {
    if (type === ClipType.EXPRESSION) {
      return true;
    }
  }
  if (dragType === AssetType.EXPRESSION) {
    if (type === ClipType.EXPRESSION) {
      return true;
    }
  }
  if (dragType === AssetType.AUDIO) {
    if (group === ClipGroup.CHARACTER && type === ClipType.AUDIO) {
      return true;
    }
    if (group === ClipGroup.GLOBAL_AUDIO) {
      return true;
    }
    if (group === ClipGroup.CAMERA) {
      DndAsset.notDropText = "Cannot drag audio onto camera track";
    }
    if (type === ClipType.ANIMATION) {
      DndAsset.notDropText = "Cannot drag audio onto character animation track";
    }
    if (type === ClipType.EXPRESSION) {
      DndAsset.notDropText = "Cannot drag audio onto facial expression track";
    }
  }
  return false;
}
