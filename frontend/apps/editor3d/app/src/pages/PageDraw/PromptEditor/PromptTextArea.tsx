import React from "react";
import { SparklesIcon, Undo2, Smartphone, LayoutPanelTop } from "lucide-react";
import { PromptTextAreaProps, AspectRatio } from "./types";
import ImagePreview from "./ImagePreview";

const PromptTextArea: React.FC<
  PromptTextAreaProps & {
    aspectRatio: AspectRatio;
    onAspectRatioChange: (r: AspectRatio) => void;
    onStyleClick: () => void;
    onImageStyleClick: () => void;
    onRandomizeClick: () => void;
    onVaryClick: () => void;
  }
> = ({
  value,
  onChange,
  images,
  onImageUpdate,
  onImageRemove,
  aspectRatio,
  onAspectRatioChange,
  onStyleClick,
  onImageStyleClick,
  onRandomizeClick,
  onVaryClick,
}) => {
  /* helper to cycle aspect ratios */
  const getNextAspectRatio = (): AspectRatio => {
    const ratios: AspectRatio[] = ["1:1", "3:2", "2:3"];
    const i = ratios.indexOf(aspectRatio);
    return ratios[(i + 1) % ratios.length];
  };

  /* button styling – matches existing toolbar */
  const buttonClass =
    "flex items-center gap-1 rounded-lg px-3 py-1 " +
    "bg-[#3A3A3A] text-sm text-white hover:bg-[#4A4A4A] " +
    "transition-colors";

  /* ───────── render ───────── */
  return (
    <div className="flex w-full overflow-hidden rounded-2xl bg-[#2A2A2A]">
      {/* LEFT ▸ prompt + toolbar */}
      <div className="flex flex-grow flex-col">
        {/* prompt field */}
        <div className="flex-grow px-7 pt-5">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your prompt here…"
            className="
          max-h-[175px] min-h-[120px] w-full flex-grow resize-y
          border-none bg-transparent text-xl
          text-white 
          placeholder-gray-400 outline-none 
        "
          />
        </div>

        {/* bottom toolbar */}
        <div className="flex items-center gap-4 px-5 py-3">
          {/* Style */}
          <button onClick={onStyleClick} className={buttonClass}>
            <SparklesIcon size={16} />
            <span>Style</span>
          </button>

          {/* Image Style */}
          <button onClick={onImageStyleClick} className={buttonClass}>
            <LayoutPanelTop size={16} />
            <span>Image&nbsp;Style</span>
          </button>

          {/* Aspect Ratio */}
          <button
            onClick={() => onAspectRatioChange(getNextAspectRatio())}
            className={buttonClass}
          >
            <Smartphone
              size={16}
              className={aspectRatio !== "1:1" ? "rotate-90" : ""}
            />
            <span>{aspectRatio}</span>
          </button>

          {/* Randomize */}
          <button onClick={onRandomizeClick} className={buttonClass}>
            <div className="flex h-4 w-4 items-center justify-center">🎲</div>
            <span>Randomize</span>
          </button>

          {/* Vary */}
          <button onClick={onVaryClick} className={buttonClass}>
            <Undo2 size={16} />
            <span>Vary</span>
          </button>
        </div>
      </div>

      {/* RIGHT ▸ image strip (optional) */}
      {images.length > 0 && (
        <div className="flex w-24 flex-col gap-2 bg-[#232323] p-2">
          {images.map((img) => (
            <ImagePreview
              key={img.id}
              image={img}
              onUpdate={onImageUpdate}
              onRemove={onImageRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromptTextArea;
