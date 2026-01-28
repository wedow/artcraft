import { create } from "zustand";

export interface MotionVideo {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
  duration?: number;
}

export interface CharacterImage {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
}

export type VideoQuality = "480p" | "720p" | "1080p";
export type SceneControlMode = "video" | "image";
export type OrientationType = "video" | "image";

export interface GeneratedVideo {
  cdn_url: string;
  media_token: string;
}

export interface MotionControlBatch {
  id: string;
  status: "pending" | "completed" | "failed";
  prompt: string;
  motionVideo?: MotionVideo;
  characterImage?: CharacterImage;
  generatedVideo?: GeneratedVideo;
  createdAt: number;
}

interface MotionControlState {
  // Input states
  motionVideo: MotionVideo | null;
  characterImage: CharacterImage | null;

  // Settings
  quality: VideoQuality;
  sceneControlMode: SceneControlMode;
  prompt: string;
  orientation: OrientationType;

  // Batches (generation history)
  batches: MotionControlBatch[];

  // Actions
  setMotionVideo: (video: MotionVideo | null) => void;
  setCharacterImage: (image: CharacterImage | null) => void;
  setQuality: (quality: VideoQuality) => void;
  setSceneControlMode: (mode: SceneControlMode) => void;
  setPrompt: (prompt: string) => void;
  setOrientation: (orientation: OrientationType) => void;

  startBatch: (prompt: string, subscriberId: string) => void;
  completeBatch: (video: GeneratedVideo, subscriberId?: string) => void;
  failBatch: (subscriberId?: string) => void;
  reset: () => void;
}

const initialState = {
  motionVideo: null,
  characterImage: null,
  quality: "720p" as VideoQuality,
  sceneControlMode: "video" as SceneControlMode,
  prompt: "",
  orientation: "video" as OrientationType,
  batches: [] as MotionControlBatch[],
};

export const useMotionControlStore = create<MotionControlState>((set) => ({
  ...initialState,

  setMotionVideo: (video) => set({ motionVideo: video }),
  setCharacterImage: (image) => set({ characterImage: image }),
  setQuality: (quality) => set({ quality }),
  setSceneControlMode: (mode) => set({ sceneControlMode: mode }),
  setPrompt: (prompt) => set({ prompt }),
  setOrientation: (orientation) => set({ orientation }),

  startBatch: (prompt, subscriberId) =>
    set((state) => ({
      batches: [
        ...state.batches,
        {
          id: subscriberId,
          status: "pending",
          prompt,
          motionVideo: state.motionVideo ?? undefined,
          characterImage: state.characterImage ?? undefined,
          createdAt: Date.now(),
        },
      ],
    })),

  completeBatch: (video, subscriberId) =>
    set((state) => ({
      batches: state.batches.map((batch) =>
        batch.id === subscriberId
          ? { ...batch, status: "completed", generatedVideo: video }
          : batch,
      ),
    })),

  failBatch: (subscriberId) =>
    set((state) => ({
      batches: state.batches.map((batch) =>
        batch.id === subscriberId ? { ...batch, status: "failed" } : batch,
      ),
    })),

  reset: () => set(initialState),
}));
