export default interface IAnimationClip {
  speed: number;
  duration: number;
  startTime: number;
  endTime: number;
  evaluate: (time: number) => void;
}
