import { Button } from "~/components";
import {
  addCharacterAnimation,
  addCharacterExpression,
  addGlobalAudio,
} from "~/pages/PageEnigma/signals";
import { AssetType } from "~/enums";
import { CallIn } from "~/stories/TimelineStories/CallIn";
import { useState } from "react";

export const DnDActions = ({ setRefresh }: { setRefresh: () => void }) => {
  const [callValues, setCallValues] = useState<any>(null);
  return (
    <>
      <div>
        <div>
          <strong>DnD Actions</strong>
        </div>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              setCallValues({
                dragItem: {
                  version: 1,
                  type: AssetType.ANIMATION,
                  media_type: "type",
                  media_id: "id",
                  name: "walk",
                  length: 85,
                },
                characterId: "michael",
                offset: 27,
              });
              addCharacterAnimation({
                dragItem: {
                  version: 1,
                  type: AssetType.ANIMATION,
                  media_type: "type",
                  media_id: "id",
                  name: "walk",
                  length: 85,
                },
                characterId: "michael",
                offset: 27,
              });
            }, 300);
          }}
        >
          Drop Animation (on michael)
        </Button>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              setCallValues({
                dragItem: {
                  version: 1,
                  type: AssetType.EXPRESSION,
                  media_type: "type",
                  media_id: "id",
                  name: "smile",
                  length: 85,
                },
                characterId: "michael",
                offset: 10,
              });
              addCharacterExpression({
                dragItem: {
                  version: 1,
                  type: AssetType.EXPRESSION,
                  media_type: "type",
                  media_id: "id",
                  name: "smile",
                  length: 85,
                },
                characterId: "michael",
                offset: 10,
              });
            }, 300);
          }}
        >
          Drop Expression (on michael)
        </Button>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              setCallValues({
                dragItem: {
                  version: 1,
                  type: AssetType.AUDIO,
                  media_type: "type",
                  media_id: "id",
                  name: "singing",
                  length: 106,
                },
                audioId: "AG-1",
                offset: 5,
              });
              addGlobalAudio({
                dragItem: {
                  version: 1,
                  type: AssetType.AUDIO,
                  media_type: "type",
                  media_id: "id",
                  name: "singing",
                  length: 106,
                },
                audioId: "AG-1",
                offset: 5,
              });
            }, 300);
          }}
        >
          Drop Audio (on global)
        </Button>
      </div>
      <CallIn values={callValues} />
    </>
  );
};
