import React, { useEffect, useState } from "react";
import SceneCard from "./SceneCard";
import Marquee from "react-fast-marquee";
import {
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";

interface ScrollingSceneCarouselProps {
  small?: boolean;
  showGradient?: boolean;
  gradientColor?: string;
  pauseOnHover?: boolean;
  className?: string;
}

export default function ScrollingSceneCarousel({
  small,
  showGradient = true,
  gradientColor,
  pauseOnHover = false,
  className,
}: ScrollingSceneCarouselProps) {
  const [mediaItems, setMediaItems] = useState<MediaFile[]>([]);

  useEffect(() => {
    fetchMediaItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMediaItems = async () => {
    try {
      const response = await fetch(
        "https://api.storyteller.ai/v1/media_files/list_featured?page_size=100&filter_media_classes=video"
      );
      const data = await response.json();
      if (data.success) {
        setMediaItems(shuffleArray(data.results));
      }
    } catch (error) {
      console.error("Error fetching media items:", error);
    }
  };

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const halfLength = Math.ceil(mediaItems.length / 2);
  const firstHalf = mediaItems.slice(0, halfLength);
  const secondHalf = mediaItems.slice(halfLength);

  return (
    <div
      className={`d-flex gap-5 mt-5 overflow-hidden flex-column ${className}`.trim()}
    >
      <Marquee
        gradient={showGradient ? true : false}
        // this component doesn't seem to like string values and was causing errors
        // so hex is converted to an RGB array -VH
        gradientColor={gradientColor ? gradientColor : "#1a1a27"}
        //gradientColor={[26, 26, 29]}
        gradientWidth={small ? 80 : 200}
        speed={small ? 100 : 50}
        pauseOnHover={pauseOnHover ? true : false}
        direction="left"
      >
        {firstHalf.map((item, index) => (
          <div key={index} style={{ aspectRatio: "16 / 9" }}>
            <SceneCard
              image={
                MediaLinks(item.media_links).videoAnimated
                  ? MediaLinks(item?.media_links).videoAnimated!(360)
                  : ""
              }
              alt={`Scene ${index}`}
              title={item.maybe_title || "Scene"}
              token={item.token}
              small={small}
            />
          </div>
        ))}
      </Marquee>
      {!small && (
        <Marquee
          gradient={showGradient ? true : false}
          gradientColor={gradientColor ? gradientColor : "#1a1a27"}
          //gradientColor={[26, 26, 29]}
          gradientWidth={small ? 80 : 200}
          speed={small ? 100 : 50}
          pauseOnHover={pauseOnHover ? true : false}
          direction="right"
        >
          {secondHalf.map((item, index) => (
            <div key={index} style={{ aspectRatio: "16 / 9" }}>
              <SceneCard
                image={
                  MediaLinks(item.media_links).videoAnimated
                    ? MediaLinks(item?.media_links).videoAnimated!(360)
                    : ""
                }
                alt={`Scene ${index}`}
                title={item.maybe_title || "Scene"}
                token={item.token}
                small={small}
              />
            </div>
          ))}
        </Marquee>
      )}
    </div>
  );
}
