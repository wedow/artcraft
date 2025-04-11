import { MouseEvent, useCallback, useState } from "react";
import {
  deleteAudioClip,
  deleteCharacterClip,
  deleteKeyframe,
  selectedItem,
} from "~/pages/PageEnigma/signals";
import { Clip, Keyframe } from "~/pages/PageEnigma/models";
import { deletePromptTravelClip } from "~/pages/PageEnigma/signals/promptTravelGroup";
import { DoNotShow } from "~/constants";
import { ConfirmationModal } from "~/components";
import { useSignals } from "@preact/signals-react/runtime";

function getItemType(item: Clip | Keyframe | null) {
  if (!item) {
    return "";
  }
  return (item as Clip).clip_uuid ? "clip" : "keyframe";
}

export const useOnDelete = () => {
  useSignals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Clip | Keyframe | null>(
    null,
  );

  const onDelete = useCallback((item: Clip | Keyframe) => {
    if ((item as Clip).clip_uuid) {
      deleteCharacterClip(item as Clip);
      deleteAudioClip(item as Clip);
      deletePromptTravelClip(item as Clip);
    } else {
      deleteKeyframe(item as Keyframe);
    }
    selectedItem.value = null;
  }, []);

  const onDeleteAsk = useCallback(
    (event: KeyboardEvent | MouseEvent, item: Clip | Keyframe) => {
      event.stopPropagation();
      event.preventDefault();
      const show = localStorage.getItem(`Delete-${getItemType(item)}`);
      if (show === DoNotShow) {
        onDelete(item);
        return;
      }
      setDeletingItem(item);
      setDialogOpen(true);
    },
    [onDelete],
  );

  const confirmationModal = () => {
    return (
      <ConfirmationModal
        title={`Delete ${getItemType(deletingItem)}`}
        text={`Are you sure you want to delete the selected ${getItemType(deletingItem)}?`}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onOk={() => {
          onDelete(deletingItem!);
          setDialogOpen(false);
        }}
        okText="Delete"
        okColor="bg-brand-primary"
        onCancel={() => setDialogOpen(false)}
        canHide
      />
    );
  };

  return {
    onDelete,
    onDeleteAsk,
    dialogOpen,
    setDialogOpen,
    confirmationModal,
  };
};
