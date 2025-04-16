import { useState } from "react";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownToLine } from "@fortawesome/pro-solid-svg-icons";
import { LightboxModal } from "~/components/reusable/LightboxModal";
import { GetCdnOrigin } from "~/api/GetCdnOrigin";

interface Props {
  job: {
    token: string;
    maybe_title: string;
    updated_at: string;
    public_bucket_path: string;
    maybe_style_name?: string;
  };
}

export function CompletedCard({ job }: Props) {
  const [loadError, setLoadError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cdnOrigin = GetCdnOrigin();
  const mediaPath = job?.public_bucket_path || "";
  const downloadLink = `${cdnOrigin}${mediaPath}`;
  const imageUrl = downloadLink;
  const fullImageUrl = downloadLink;

  if (!job) return null;

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
        <a
          href={downloadLink}
          download
          onClick={(e) => e.stopPropagation()}
          className="flex h-9 w-9 items-center justify-center text-lg text-white/60 transition-all hover:text-white"
        >
          <FontAwesomeIcon icon={faDownToLine} />
        </a>
      </div>

      <LightboxModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={fullImageUrl}
        imageAlt={job.maybe_title ?? "unknown"}
        onImageError={() => setLoadError(true)}
        title={job.maybe_title}
        createdAt={job.updated_at}
        downloadUrl={downloadLink}
        additionalInfo={
          job.maybe_style_name && (
            <div className="text-sm text-white/60">
              Style: {job.maybe_style_name}
            </div>
          )
        }
      />
    </>
  );
}
