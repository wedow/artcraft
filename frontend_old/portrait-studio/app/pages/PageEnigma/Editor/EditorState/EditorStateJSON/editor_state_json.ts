import { SceneGenereationMetaData } from "../../../models/sceneGenerationMetadata";
import { SceneStateJson } from "./scene_state_json";
import { TimelineStateJson } from "./timeline_state_json";

export interface EditorStateJson {
  version: number;
  sceneGenerationMetaData: SceneGenereationMetaData;
  sceneStateJson: SceneStateJson;
  timelineStateJson: TimelineStateJson;
  snapshotTime: string; // make one via `new Date().toISOString()`
}
