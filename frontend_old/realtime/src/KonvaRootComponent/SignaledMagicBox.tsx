import { MagicBox } from "~/components/features";
import { uiAccess } from "~/signals";
export const SignaledMagicBox = () => {
  const { isShowing, orientation, scale } = uiAccess.magicBox.signal.value;
  return <MagicBox show={isShowing} orientation={orientation} scale={scale} />;
};
