import { create } from "zustand";

// ----- 2D Prompt Box Store -----
type AspectRatio = "3:2" | "2:3" | "1:1";

interface Prompt2DStore {
  prompt: string;
  aspectRatio: AspectRatio;
  useSystemPrompt: boolean;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setUseSystemPrompt: (value: boolean) => void;
}

export const usePrompt2DStore = create<Prompt2DStore>()((set) => ({
  prompt: "",
  aspectRatio: "3:2",
  useSystemPrompt: true,
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
}));

// Export the same store under the old generic name for backward-compatibility.
export { usePrompt2DStore as usePromptStore };

// ----- 3D Prompt Box Store -----
interface Prompt3DStore {
  prompt: string;
  useSystemPrompt: boolean;
  setPrompt: (prompt: string) => void;
  setUseSystemPrompt: (value: boolean) => void;
}

export const usePrompt3DStore = create<Prompt3DStore>()((set) => ({
  prompt: "",
  useSystemPrompt: true,
  setPrompt: (prompt) => set({ prompt }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
}));

// ----- Image Prompt Box Store -----
interface PromptImageStore {
  prompt: string;
  aspectRatio: AspectRatio;
  useSystemPrompt: boolean;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setUseSystemPrompt: (value: boolean) => void;
}

export const usePromptImageStore = create<PromptImageStore>()((set) => ({
  prompt: "",
  aspectRatio: "3:2",
  useSystemPrompt: true,
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
}));

// ----- Video Prompt Box Store -----
type Resolution = "720p" | "480p";

interface PromptVideoStore {
  prompt: string;
  resolution: Resolution;
  useSystemPrompt: boolean;
  setPrompt: (prompt: string) => void;
  setResolution: (resolution: Resolution) => void;
  setUseSystemPrompt: (value: boolean) => void;
}

export const usePromptVideoStore = create<PromptVideoStore>()((set) => ({
  prompt: "",
  resolution: "720p",
  useSystemPrompt: true,
  setPrompt: (prompt) => set({ prompt }),
  setResolution: (resolution) => set({ resolution }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
}));
