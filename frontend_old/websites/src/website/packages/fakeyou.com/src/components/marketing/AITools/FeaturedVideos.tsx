import React, { useEffect, useState } from "react";
import { ListFeaturedMediaFiles } from "@storyteller/components/src/api/media_files/ListFeaturedMediaFiles";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";
import { useLazyLists } from "hooks";
import prepFilter from "resources/prepFilter";
import { Button } from "components/common";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import {
  faArrowRight,
  faImageUser,
  faLips,
  faSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import { Link } from "react-router-dom";
import "./FeaturedVideos.scss";

const getRandomFilter = () => {
  const filters = ["live_portrait", "lipsync", "vst"]; // Possible products to show
  const randomFilter = filters[Math.floor(Math.random() * filters.length)];
  return randomFilter;
};

export const FeaturedVideos = () => {
  const [selectedFilter] = useState<string>(() => getRandomFilter());
  const [list, listSet] = useState<MediaFile[]>([]);
  const [shuffledList, setShuffledList] = useState<MediaFile[]>([]);

  const media = useLazyLists({
    addQueries: {
      ...prepFilter(selectedFilter, "filter_products"),
    },
    fetcher: ListFeaturedMediaFiles,
    list,
    listSet,
    requestList: true,
    urlUpdate: false,
  });

  // Shuffle the list only once on mount and media.list has items
  useEffect(() => {
    if (media.list.length > 0 && shuffledList.length === 0) {
      const shuffleArray = (array: any[]) => {
        return array.sort(() => Math.random() - 0.5);
      };
      const shuffled = shuffleArray(media.list).slice(0, 3);
      setShuffledList(shuffled);
    }
  }, [media.list, shuffledList.length]);

  if (media.list.length === 0) {
    return null;
  }

  const getContent = (filter: string) => {
    switch (filter) {
      case "lipsync":
        return {
          heading: "Here are some videos our users made with Lip Sync",
          buttonText: "Try Lip Sync now!",
          buttonLink: "/face-animator",
          icon: faLips,
        };
      case "vst":
        return {
          heading: "Here are some videos our users made with VST",
          buttonText: "Try VST now!",
          buttonLink: "/style-video",
          icon: faSparkles,
        };
      case "live_portrait":
        return {
          heading: "Here are some videos our users made with Live Portrait",
          buttonText: "Try Live Portrait now!",
          buttonLink: "/ai-live-portrait",
          icon: faImageUser,
        };
      default:
        return {
          heading: "",
          buttonText: "",
          buttonLink: "/",
        };
    }
  };

  const { heading, buttonText, buttonLink, icon } = getContent(selectedFilter);
  return (
    <div className="mb-5 pb-5">
      <div className="d-flex gap-3 flex-wrap align-items-center mb-4 mb-lg-3">
        <h3 className="fw-bold mb-0 flex-grow-1">{heading}</h3>
        <Button icon={icon} label={buttonText} small={true} to={buttonLink} />
      </div>

      <div className="featured-video-scroll-container">
        {shuffledList.map((data: any) => {
          return (
            <div key={data.token}>
              <div
                className="ratio ratio-16x9 overflow-hidden bg-black"
                style={{ borderRadius: "0.5rem 0.5rem 0rem 0rem" }}
              >
                <video
                  controls={true}
                  className="w-100 h-100 object-fit-contain"
                >
                  <source src={data.media_links.cdn_url} type="video/mp4" />
                </video>
              </div>
              <div
                className="panel"
                style={{
                  borderRadius: "0rem 0rem 0.5rem 0.5rem",
                  padding: "0.75rem",
                }}
              >
                <div className="d-flex gap-3 align-items-center">
                  {data.maybe_creator && (
                    <div className="d-flex gap-2 align-items-center flex-grow-1">
                      <Gravatar
                        email_hash={data.maybe_creator?.gravatar_hash}
                        size={24}
                        username={data.maybe_creator?.username}
                        avatarIndex={
                          data.maybe_creator?.default_avatar?.image_index
                        }
                        backgroundIndex={
                          data.maybe_creator?.default_avatar?.color_index
                        }
                      />
                      <Link
                        to={`/profile/${data.maybe_creator?.username}`}
                        className="fw-semibold text-white"
                      >
                        {data.maybe_creator?.display_name}
                      </Link>
                    </div>
                  )}

                  <Button
                    label="View Details"
                    variant="link"
                    small={true}
                    className="fs-7"
                    icon={faArrowRight}
                    iconFlip={true}
                    to={`/media/${data.token}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
