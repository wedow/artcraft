
export enum SizeIconOption {
  Landscape,
  Portrait,
  Square,
}

export interface SizeOption {
  label: string;
  tauriValue: string;
  icon: SizeIconOption;
}