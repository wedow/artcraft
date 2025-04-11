import frame from "./frame_gradient_vertical.webp";

export const MagicBox = ({
  show = false,
  orientation = "vertical",
  scale = 1,
}: {
  show?: boolean;
  orientation?: "vertical" | "horizontal";
  scale?: number;
}) => {
  if (!show) {
    return null; // nothing
  }
  const rotation = orientation === "vertical" ? "rotate-0" : "rotate-90";
  const width = 720 * scale;
  return (
    <div className="fixed flex h-full w-full select-none items-center justify-center">
      <img
        src={frame}
        className={"pointer-events-none " + rotation}
        width={width}
      />
    </div>
  );
};
