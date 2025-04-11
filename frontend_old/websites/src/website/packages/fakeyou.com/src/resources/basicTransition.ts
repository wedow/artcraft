import { config } from "@react-spring/web";
const n = (x: any) => {};

const basicTransition = ({ ...overwrite }, onRest = n, onStart = n) => ({
  config: config.gentle,
  // config: { duration: 3000 },
  from: { opacity: 0 },
  enter: { opacity: 1.0, position: "relative" },
  leave: { opacity: 0, position: "absolute" },
  onRest,
  onStart,
  ...overwrite,
});

export default basicTransition;
