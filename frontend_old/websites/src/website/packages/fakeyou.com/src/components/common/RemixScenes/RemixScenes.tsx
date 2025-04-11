import { Panel } from "components/common";
import React from "react";
import HoverVideoCard from "../HoverVideoCard";

interface RemixScenesProps {
  allowRemix?: boolean;
}

export default function RemixScenes(props: RemixScenesProps) {
  const cards = [
    {
      title: "Space Station",
      defaultVideo: "/videos/remix/space_station_result.mp4",
      hoverVideo: "/videos/remix/space_station_raw.mp4",
      url: "https://studio.storyteller.ai/m_ezkyxc4fqe6s8rmq7352zrbvgwq4w8",
    },
    {
      title: "Walking Down the Dock",
      defaultVideo: "/videos/remix/dock_walk_result.mp4",
      hoverVideo: "/videos/remix/dock_walk_raw.mp4",
      url: "https://studio.storyteller.ai/m_bcmc0k8ny4meywdmdy2vn2eafeyr0r",
    },
    {
      title: "The Beach",
      defaultVideo: "/videos/remix/beach_result.mp4",
      hoverVideo: "/videos/remix/beach_raw.mp4",
      url: "https://studio.storyteller.ai/m_k10hh6qvb8zfctk901avmnv2brqpyw",
    },
    {
      title: "The Market",
      defaultVideo: "/videos/remix/market_result.mp4",
      hoverVideo: "/videos/remix/market_raw.mp4",
      url: "https://studio.storyteller.ai/m_pp7f78gpyd7kmxkbsp6x9vngqg12gc",
    },
    {
      title: "Cherry Blossom",
      defaultVideo: "/videos/remix/cherry_blossom_result.mp4",
      hoverVideo: "/videos/remix/cherry_blossom_raw.mp4",
      url: "https://studio.storyteller.ai/m_97xhpc7dt7xnfwj7paxg94mt95dshv",
    },
    {
      title: "Pirate Ship",
      defaultVideo: "/videos/remix/pirate_ship_result.mp4",
      hoverVideo: "/videos/remix/pirate_ship_raw.mp4",
      url: "https://studio.storyteller.ai/m_tz8vm3vw3xsk5z5qvpq1y9cczdn2vp",
    },
  ];

  return (
    <Panel clear={true}>
      <div className="text-center">
        <div className="row gy-4 gx-3 gx-lg-4">
          {cards.map((card, index) => (
            <div className="col-12 col-lg-4">
              <HoverVideoCard
                beforeVideoSrc={card.defaultVideo}
                afterVideoSrc={card.hoverVideo}
                title={card.title}
                url={card.url}
                allowRemix={props.allowRemix}
              />
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
