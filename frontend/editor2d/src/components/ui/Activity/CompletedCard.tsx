import { useState } from "react";
import dayjs from "dayjs";
import { BaseDialog } from "../BaseDialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  job: {
    token: string;
    maybe_title: string;
    public_bucket_path: string;
    updated_at: string;
    maybe_style_name?: string;
  };
}

export function CompletedCard({ job }: Props) {
  const [loadError, setLoadError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const imageUrl = job.public_bucket_path + "-thumb.gif";
  const fullImageUrl = job.public_bucket_path;

  return (
    <>
      <div
        className="flex w-full items-center justify-between rounded-lg p-2 text-start transition-all duration-150 hover:cursor-pointer hover:bg-white/10"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex gap-4">
          <div className="flex aspect-square h-14 w-14 justify-center overflow-hidden rounded-lg border border-[#A9A9A9]/50 bg-black/60">
            <img
              src={
                loadError ? "/resources/images/movie-placeholder.png" : imageUrl
              }
              className="h-full w-full object-cover"
              alt={job.maybe_title ?? "unknown"}
              crossOrigin="anonymous"
              onError={() => setLoadError(true)}
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="font-medium">{job.maybe_title || "Untitled"}</div>
            <div className="text-sm text-white/60">
              {dayjs(job.updated_at).format("MMM D, YYYY HH:mm:ss")}
            </div>
          </div>
        </div>
      </div>

      <BaseDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="h-[80vh] w-[75vw] max-w-[75vw] p-0"
      >
        <div className="relative grid h-full grid-cols-3 gap-6">
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white"
          >
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
          <div className="col-span-2 flex h-full items-center justify-center overflow-hidden rounded-l-xl bg-black/40">
            <img
              src={fullImageUrl}
              className="h-full w-full object-contain"
              alt={job.maybe_title ?? "unknown"}
              crossOrigin="anonymous"
              onError={() => setLoadError(true)}
            />
          </div>
          <div className="flex flex-col gap-4 py-5">
            <div className="text-xl font-medium">
              {job.maybe_title || "Untitled"}
            </div>
            <div className="text-sm text-white/60">
              Created: {dayjs(job.updated_at).format("MMM D, YYYY HH:mm:ss")}
            </div>
            {job.maybe_style_name && (
              <div className="text-sm text-white/60">
                Style: {job.maybe_style_name}
              </div>
            )}
          </div>
        </div>
      </BaseDialog>
    </>
  );
}
