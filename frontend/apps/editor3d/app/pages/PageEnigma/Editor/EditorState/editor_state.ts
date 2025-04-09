import { SceneGenereationMetaData } from "../../models/sceneGenerationMetadata";
import { EditorStateJson } from "./EditorStateJSON";
// import Scene from "../scene";
// import { TimeLine } from "../timeline";
import { SceneState } from "./scene_state";
import { TimelineState } from "./TimelineState";

export class EditorState {
  version: number;
  sceneGenerationMetaData: SceneGenereationMetaData | undefined;
  sceneState: SceneState | undefined;
  timelineState: TimelineState | undefined;

  constructor({ editorVersion }: { editorVersion: number }) {
    this.version = editorVersion;
  }

  public async toJSON() {
    if (
      !this.sceneGenerationMetaData ||
      !this.sceneState ||
      !this.timelineState
    ) {
      throw "Error in EditorState.toJSON: data undefined";
    }
    const result: EditorStateJson = {
      version: this.version,
      sceneGenerationMetaData: this.sceneGenerationMetaData,
      sceneStateJson: await this.sceneState.toJSON(),
      timelineStateJson: await this.timelineState.toJSON(),
      snapshotTime: new Date().toISOString(),
    };
    return result;
  }
}
