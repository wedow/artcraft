import { faDownToLine } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "~/components";
import { formatDistanceToNow } from "date-fns";
import { v4 as uuidv4 } from "uuid";

interface QueueCardProps {
  prompt: string;
  imgSrc: string;
  downloadLink?: string;
  onClick?: () => void;
  isGenerating?: boolean;
  createdDate: Date;
}

export const QueueCard = ({
  prompt,
  imgSrc,
  onClick,
  isGenerating,
  createdDate,
}: QueueCardProps) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imgSrc;
    link.download = `${uuidv4()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={onClick} className="text-start">
      <div className="group cursor-pointer px-5 py-5 transition-all hover:bg-brand-secondary-950/30">
        <div className="relative aspect-video overflow-hidden rounded-lg border border-[#3F3F3F] bg-brand-secondary-900 transition-all group-hover:bg-brand-secondary-800">
          {isGenerating && (
            <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-md border border-[#3F3F3F] bg-brand-secondary-600/50 px-1.5 py-1 text-[13px] font-semibold">
              <svg
                className="h-3.5 w-3.5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="me-1 font-medium opacity-90">Generating</span>
              0%
            </div>
          )}
          <img
            src={imgSrc}
            alt="Queue Preview"
            className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110"
          />
        </div>
        <p className="mt-4 font-semibold opacity-80 transition-all group-hover:opacity-95">
          "{prompt}"
        </p>
        <div className="mt-3 flex items-center gap-2">
          <p className="grow text-sm opacity-50">
            {formatDistanceToNow(createdDate, { addSuffix: true })}
          </p>
          <Button
            variant="secondary"
            icon={faDownToLine}
            aria-label="Download"
            className="border-white/15 text-xs"
            onClick={handleDownload}
          >
            Save
          </Button>
        </div>
      </div>
      <hr className="px-5 opacity-10" />
    </button>
  );
};
