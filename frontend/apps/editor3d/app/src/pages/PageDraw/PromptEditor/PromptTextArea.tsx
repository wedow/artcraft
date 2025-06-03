import React from 'react';
import {
  SparklesIcon,
  Undo2,
  Smartphone,
  LayoutPanelTop,
} from 'lucide-react';
import { PromptTextAreaProps, AspectRatio } from './types';
import ImagePreview from './ImagePreview';

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
    const ratios: AspectRatio[] = ['1:1', '3:2', '2:3'];
    const i = ratios.indexOf(aspectRatio);
    return ratios[(i + 1) % ratios.length];
  };

  /* button styling – matches existing toolbar */
  const buttonClass =
    'flex items-center gap-1 rounded-lg px-3 py-1 ' +
    'bg-[#3A3A3A] text-sm text-white hover:bg-[#4A4A4A] ' +
    'transition-colors';

  /* ───────── render ───────── */
  return (
    <div className="w-full bg-[#2A2A2A] rounded-2xl overflow-hidden flex">
      {/* LEFT ▸ prompt + toolbar */}
      <div className="flex flex-col flex-grow">
        {/* prompt field */}
        <div className="flex-grow px-7 pt-5">
        <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your prompt here…"
        className="
          flex-grow w-full bg-transparent border-none outline-none
          text-xl text-white placeholder-gray-400
          resize-y   /* keep the browser’s vertical resize */
          min-h-[120px] max-h-[175px]   /* cap between 120 px and 300 px */
        "
      /></div>

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
              className={aspectRatio !== '1:1' ? 'rotate-90' : ''}
            />
            <span>{aspectRatio}</span>
          </button>

          {/* Randomize */}
          <button onClick={onRandomizeClick} className={buttonClass}>
            <div className="w-4 h-4 flex items-center justify-center">🎲</div>
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
        <div className="w-24 bg-[#232323] flex flex-col gap-2 p-2">
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
