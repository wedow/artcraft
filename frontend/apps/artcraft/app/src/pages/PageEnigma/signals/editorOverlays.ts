import { signal } from "@preact/signals-core";

export const editorLoader = signal<{
  isShowing: boolean;
  message: string | undefined;
}>({
  isShowing: false,
  message: "Loading Editor Engine 🦊",
});

export const showEditorLoader = (message?: string) => {
  editorLoader.value = {
    isShowing: true,
    message,
  };
};
export const hideEditorLoader = () => {
  editorLoader.value = {
    isShowing: false,
    message: editorLoader.value.message,
    // it is important to keep the message so the loader fades out nicely
  };
};

export const editorLetterBox = signal<boolean>(true);

export const toggleEditorLetterBox = (newState?: boolean) => {
  editorLetterBox.value =
    newState !== undefined ? newState : !editorLetterBox.value;
};
