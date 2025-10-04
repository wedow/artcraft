
export enum SizeIconOption {
  Landscape,
  Portrait,
  Square,
}

export interface SizeOption {
  textLabel: string;
  tauriValue: string;
  icon: SizeIconOption;
}