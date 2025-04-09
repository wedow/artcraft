import { WeightType } from "@storyteller/components/src/api/_common/enums/WeightType";

type WeightTypeInfo = {
  [key in WeightType]: { label: string; color: string; fullLabel?: string };
};

const weightTypeInfo: WeightTypeInfo = {
  [WeightType.TT2]: { label: "TT2", color: "teal", fullLabel: "Tacotron 2" },
  [WeightType.HIFIGAN_TT2]: {
    label: "HifiGAN TT2",
    color: "aqua",
    fullLabel: "HifiGAN Tacotron 2",
  },
  [WeightType.GPT_SO_VITS]: {
    label: "TTS+",
    color: "blue",
    fullLabel: "TTS+",
  },
  [WeightType.TT2_5]: { label: "TTS+", color: "blue", fullLabel: "TTS+" },
  [WeightType.RVCv2]: { label: "RVC v2", color: "orange", fullLabel: "RVC v2" },
  [WeightType.SD_15]: {
    label: "SD 1.5",
    color: "green",
    fullLabel: "Stable Diffusion 1.5",
  },
  [WeightType.SDXL]: {
    label: "SDXL",
    color: "purple",
    fullLabel: "Stable Diffusion XL",
  },
  [WeightType.SVC]: { label: "SVC", color: "turquoise", fullLabel: "SVC" },
  [WeightType.LORA]: { label: "LoRA", color: "pink", fullLabel: "LoRA" },
  [WeightType.VALL_E]: {
    label: "VALL-E",
    color: "ultramarine",
    fullLabel: "VALL-E",
  },
  [WeightType.NONE]: { label: "None", color: "gray", fullLabel: "None" },
};

export default function useWeightTypeInfo(weightsType: WeightType) {
  return (
    weightTypeInfo[weightsType] || {
      label: "None",
      color: "gray",
      fullLabel: "None",
    }
  );
}
