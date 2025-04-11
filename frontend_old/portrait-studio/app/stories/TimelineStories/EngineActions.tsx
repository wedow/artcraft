import { Button } from "~/components";
import Queue, { QueueNames } from "~/pages/PageEnigma/Queue";
import { fromEngineActions } from "~/pages/PageEnigma/Queue/fromEngineActions";
import { AssetType, ClipGroup } from "~/enums";
import { toTimelineActions } from "~/pages/PageEnigma/Queue/toTimelineActions";

export const EngineActions = ({ setRefresh }: { setRefresh: () => void }) => {
  return (
    <>
      <div>
        <div>
          <strong>Engine Actions</strong>
        </div>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              Queue.publish({
                queueName: QueueNames.FROM_ENGINE,
                action: fromEngineActions.UPDATE_CHARACTER_ID,
                data: {
                  version: 1,
                  type: AssetType.CHARACTER,
                  media_id: "id",
                  object_uuid: "michael",
                  name: "Michael",
                },
              });
            }, 300);
          }}
        >
          Add Character (michael)
        </Button>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              Queue.publish({
                queueName: QueueNames.FROM_ENGINE,
                action: fromEngineActions.ADD_OBJECT,
                data: {
                  version: 1,
                  type: AssetType.OBJECT,
                  media_id: "id",
                  object_uuid: "square",
                  name: "Square",
                },
              });
            }, 300);
          }}
        >
          Add Object (square)
        </Button>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              Queue.publish({
                queueName: QueueNames.FROM_ENGINE,
                action: fromEngineActions.DELETE_OBJECT,
                data: {
                  version: 1,
                  type: AssetType.CHARACTER,
                  media_id: "id",
                  object_uuid: "michael",
                  name: "Michael",
                },
              });
            }, 300);
          }}
        >
          Delete Character (michael)
        </Button>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              Queue.publish({
                queueName: QueueNames.FROM_ENGINE,
                action: fromEngineActions.DESELECT_OBJECT,
                data: null,
              });
            }, 300);
          }}
        >
          Deselect Object
        </Button>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              Queue.publish({
                queueName: QueueNames.FROM_ENGINE,
                action: fromEngineActions.RESET_TIMELINE,
                data: null,
              });
            }, 300);
          }}
        >
          Reset Timeline
        </Button>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              Queue.publish({
                queueName: QueueNames.FROM_ENGINE,
                action: fromEngineActions.SELECT_OBJECT,
                data: {
                  version: 1,
                  name: "Square",
                  media_id: "id",
                  type: AssetType.OBJECT,
                  object_uuid: "square",
                },
              });
            }, 300);
          }}
        >
          Select Object (square)
        </Button>
      </div>
      <div>
        <div>
          <strong>More Engine Actions</strong>
        </div>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              Queue.publish({
                queueName: QueueNames.FROM_ENGINE,
                action: fromEngineActions.UPDATE_TIME,
                data: {
                  currentTime: 66,
                },
              });
            }, 300);
          }}
        >
          Update Time (66)
        </Button>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              Queue.publish({
                queueName: QueueNames.FROM_ENGINE,
                action: fromEngineActions.UPDATE_TIME_LINE,
                data: [
                  {
                    version: 1,
                    group: "character",
                    name: "Default",
                    type: "fake",
                    clip_uuid: "a406ac71-b6e2-4add-a6c6-91df6a669037",
                    object_uuid: "a406ac71-b6e2-4add-a6c6-91df6a669037",
                    object_name: "Female Doll",
                    media_id: "m_r7w1tmkx2jg8nznr3hyzj4k6zhfh7d ",
                    start_offset: 0,
                    ending_offset: 0,
                    keyframe_offset: 0,
                  },
                  {
                    version: 1,
                    group: "global_audio",
                    name: "Talk (Demo Sounds)",
                    type: "audio",
                    clip_uuid: "1a6ab5a4-3eeb-49da-9756-eed36be76b44",
                    object_name: "undefined",
                    media_id: "m_403phjvjkbbaxxbz8y7r6qjay07mfd",
                    start_offset: 8,
                    ending_offset: 102.04064000000001,
                    keyframe_offset: 0,
                  },
                  {
                    version: 1,
                    group: "global_audio",
                    name: "Charlie Brown",
                    type: "audio",
                    clip_uuid: "edb83efe-6858-4d64-8651-75b137628e58",
                    object_uuid: "m_djc4975qfm9sc86r9j4ap1ryaqmjfr",
                    object_name: "undefined",
                    media_id: "m_djc4975qfm9sc86r9j4ap1ryaqmjfr",
                    start_offset: 121,
                    ending_offset: 299.98,
                    keyframe_offset: 0,
                  },
                  {
                    version: 1,
                    group: "object",
                    name: "Default",
                    type: "fake",
                    clip_uuid: "03e390e0-2eb8-4989-af6e-e53ef945d74b",
                    object_uuid: "03e390e0-2eb8-4989-af6e-e53ef945d74b",
                    object_name: "Barbie Dreamland Test",
                    media_id: "m_jn3v94e8ny4dw1cnwf9d5djhpd2q2e",
                    start_offset: 0,
                    ending_offset: 0,
                    keyframe_offset: 0,
                  },
                  {
                    version: 1,
                    group: "camera",
                    name: "::CAM::",
                    type: "transform",
                    clip_uuid: "77c12706-f31f-4d4c-8721-9f4036ab40e5",
                    object_uuid: "55b606c1-274b-4158-8531-c65a4e6748a5",
                    object_name: "::CAM::",
                    media_id: "",
                    start_offset: 0,
                    ending_offset: 59,
                    keyframe_offset: 59,
                  },
                  {
                    version: 1,
                    group: "camera",
                    name: "::CAM::",
                    type: "transform",
                    clip_uuid: "ece94dde-4597-478f-923e-b46f02e56b2a",
                    object_uuid: "55b606c1-274b-4158-8531-c65a4e6748a5",
                    object_name: "::CAM::",
                    media_id: "",
                    start_offset: 0,
                    ending_offset: 2,
                    keyframe_offset: 2,
                  },
                ],
              });
            }, 300);
          }}
        >
          Update Timeline
        </Button>
        <Button
          onClick={() => {
            setRefresh();
            setTimeout(() => {
              Queue.publish({
                queueName: QueueNames.TO_TIMELINE,
                action: toTimelineActions.ADD_KEYFRAME,
                data: {
                  version: 1,
                  group: ClipGroup.CAMERA,
                  object_uuid: "camera",
                  object_name: "Camera",
                  position: {
                    x: 1,
                    y: 2,
                    z: 3,
                  },
                  rotation: {
                    x: 1,
                    y: 2,
                    z: 3,
                  },
                  scale: {
                    x: 1,
                    y: 2,
                    z: 3,
                  },
                },
              });
            }, 300);
          }}
        >
          Add Keyframe (camera)
        </Button>
      </div>
    </>
  );
};
