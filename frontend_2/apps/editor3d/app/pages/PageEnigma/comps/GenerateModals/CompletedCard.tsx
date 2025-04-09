import { MediaInfo } from "~/pages/PageEnigma/models/movies";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDownToLine } from "@fortawesome/pro-solid-svg-icons";
import { useRef, useState } from "react";
import { BucketConfig } from "~/api/BucketConfig";
import dayjs from "dayjs";
import environmentVariables from "~/Classes/EnvironmentVariables";
import { useSignals } from "@preact/signals-react/runtime";
import { downloadFile } from "~/pages/PageEnigma/comps/GenerateModals/utils/downloadFile";
import { styleList } from "~/pages/PageEnigma/styleList";
import { GetCdnOrigin } from "~/api/GetCdnOrigin";

export function getStyleName(typeInput: string) {
  const foundStyle = styleList.find((style) => {
    return style.type === typeInput;
  });
  return foundStyle ? foundStyle.label : "Unknown Style";
}

interface Props {
  movie: MediaInfo;
  setMovieId?: (id: string) => void;
}

export function CompletedCard({ movie, setMovieId }: Props) {
  useSignals();
  const bucketConfig = useRef<BucketConfig>(new BucketConfig());
  const [loadError, setLoadError] = useState(false);
  //const downloadLink = `${environmentVariables.values.GOOGLE_API}/vocodes-public${movie.public_bucket_path}`;
  const cdnOrigin = GetCdnOrigin();
  const downloadLink = `https://${cdnOrigin}${movie.public_bucket_path}`;

  const imageUrl = bucketConfig.current.getCdnUrl(
    movie.public_bucket_path + "-thumb.gif",
    360,
    20,
  );
  const styleName =
    movie.maybe_style_name && getStyleName(movie.maybe_style_name);

  const handleClick = () => {
    setMovieId?.(movie.token);
  };

  return (
    <div
      className="flex w-full items-center justify-between rounded-lg p-2 text-start transition-all duration-150 hover:cursor-pointer hover:bg-white/10"
      onClick={handleClick}
    >
      <div className="flex gap-4">
        <div className="flex aspect-square h-14 w-14 justify-center overflow-hidden rounded-lg border border-[#A9A9A9]/50 bg-black/60">
          <img
            src={
              loadError ? "/resources/images/movie-placeholder.png" : imageUrl
            }
            className="h-full w-full object-cover"
            alt={movie.maybe_title ?? "unknown"}
            crossOrigin="anonymous"
            onError={() => setLoadError(true)}
            loading="lazy"
          />
        </div>
        <div className="flex flex-col justify-center gap-1">
          <div className="font-medium">{movie.maybe_title || "Untitled"}</div>
          <div>
            {/* {styleName && (
              <div className="text-sm text-white/60">{styleName}</div>
            )} */}
            <div className="text-sm text-white/60">
              {dayjs(movie.updated_at).format("MMM D, YYYY HH:mm:ss")}
            </div>
          </div>
        </div>
      </div>
      {/* <div className="pr-5">
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const title =
              movie.maybe_title !== null ? movie.maybe_title : "Untitled";
            downloadFile({ url: downloadLink, title });
          }}
          className="text-[15px] font-medium text-white/50 transition-all duration-150 hover:text-white/100"
        >
          <FontAwesomeIcon icon={faArrowDownToLine} className="mr-2" />
          Download
        </button>
      </div> */}
    </div>
  );
}
