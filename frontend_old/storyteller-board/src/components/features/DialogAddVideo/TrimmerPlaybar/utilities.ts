export const buttonStyles = "border border-ui-border bg-ui-panel cursor-grab";
export const verticalPositionStyles = "absolute top-1/2 -translate-y-1/2";
export const MAX_TRIM_DURATION = 6000;
export const ONE_MIN = 1000 * 60;
export enum MouseState {
  IDLE = "idle",
  DRAGGING = "dragging",
}
export type TrimData = {
  trimStartMs: number;
  trimEndMs: number;
};

export function formatSecondsToHHMMSSCS(msArg: number) {
  //example of the ISO String: 1970-01-01T 00:01:40.77 4Z
  //               index count=01234567890 12345678901 23
  const milisecond = isNaN(msArg) ? 0 : msArg;
  if (isNaN(milisecond) && import.meta.env.DEV) {
    console.warn("formatSecondsToHHMMSSCS recieved a NaN");
  }
  const isoString = new Date(Math.round(milisecond)).toISOString();
  if (milisecond >= ONE_MIN * 60)
    return isoString.substring(11, 19) + "." + isoString.substring(20, 22);
  else return isoString.substring(14, 19) + "." + isoString.substring(20, 22);
}
