import { ImgHTMLAttributes, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ArtStyleNames } from "../enums";
import { transitionTimingStyles } from "~/components/styles";

interface ArtStyleItemProps extends ImgHTMLAttributes<HTMLImageElement> {
  label: string;
  type: ArtStyleNames;
  selected: boolean;
  onSelected: (picked: ArtStyleNames) => void;
  className?: string;
  defaultImg?: string;
}

export const ArtStyleItem = ({
  label,
  type,
  selected = false,
  defaultImg = "/placeholder_images/style_placeholder.png",
  src = defaultImg,
  onSelected,
  className,
  ...imgProps
}: ArtStyleItemProps) => {
  const handleSelected = () => {
    onSelected(type);
  };

  const [imageSrc, setImageSrc] = useState<string>(defaultImg);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageSrc(src);
    img.onerror = () => setImageSrc(defaultImg);
    img.src = src || defaultImg;
  }, [src, defaultImg]);

  return (
    <button
      className={twMerge(
        "relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg border-2 transition-colors",
        transitionTimingStyles,
        selected
          ? "border-primary"
          : "border-ui-border hover:border-primary-300",
        className,
      )}
      onClick={handleSelected}
    >
      <img className="object-cover" src={imageSrc} {...imgProps} alt={label} />
      <div className="absolute bottom-0 left-0 h-2/5 w-full bg-gradient-to-t from-gray-800/90" />
      <h4 className="absolute bottom-1.5 left-2 truncate text-start text-sm font-semibold text-white drop-shadow-lg">
        {label}
      </h4>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        className={twMerge(
          "absolute right-2 top-2 size-5 shadow-xl transition-opacity",
          transitionTimingStyles,
          selected ? "opacity-100" : "opacity-0",
        )}
      >
        <path
          opacity="1"
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
          fill="#FC6B68"
        />
        <path
          d="M369 175c-9.4 9.4-9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0z"
          fill="#FFFFFF"
        />
      </svg>
    </button>
  );
};
