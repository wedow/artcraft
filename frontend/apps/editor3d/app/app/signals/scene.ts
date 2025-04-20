import { signal } from "@preact/signals-core";

export interface SceneSignal {
  isInitializing?: boolean;
  title: string | undefined;
  token: string | undefined;
  ownerToken: string | undefined;
  isModified?: boolean | undefined;
}
export const scene = signal<SceneSignal>({
  isInitializing: true,
  title: undefined,
  token: undefined,
  ownerToken: undefined,
  isModified: undefined,
});

export const signalScene = (data: SceneSignal) => {
  scene.value = {
    ...data,
    isInitializing: false,
    isModified: true,
    //TODO: MILES: implement flagging of isModified
    // from editor side, and take this out after
  };
};

export const getSceneSignals = (): SceneSignal => {
  return scene.value;
};
