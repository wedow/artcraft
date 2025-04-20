import { signal } from "@preact/signals-core";
import { Clip, Keyframe } from "~/pages/PageEnigma/models";
import { AssetType } from "~/enums";

export const selectedItem = signal<Clip | Keyframe | null>(null);

export const selectedObject = signal<{ type: AssetType; id: string } | null>(
  null,
);
