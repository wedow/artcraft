import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "~/components";
import { RemixVideo } from "~/pages/PageEnigma/Wizard/RemixVideo";
const cards = [
  {
    title: "Space Station",
    defaultVideo: "/resources/videos/remix/space_station_result.mp4",
    hoverVideo: "/resources/videos/remix/space_station_raw.mp4",
    token: "m_ezkyxc4fqe6s8rmq7352zrbvgwq4w8",
    text: "",
  },
  {
    title: "Walking Down the Dock",
    defaultVideo: "/resources/videos/remix/dock_walk_result.mp4",
    hoverVideo: "/resources/videos/remix/dock_walk_raw.mp4",
    token: "m_bcmc0k8ny4meywdmdy2vn2eafeyr0r",
    text: "",
  },
  {
    title: "The Beach",
    defaultVideo: "/resources/videos/remix/beach_result.mp4",
    hoverVideo: "/resources/videos/remix/beach_raw.mp4",
    token: "m_k10hh6qvb8zfctk901avmnv2brqpyw",
    text: "",
  },
  {
    title: "The Market",
    defaultVideo: "/resources/videos/remix/market_result.mp4",
    hoverVideo: "/resources/videos/remix/market_raw.mp4",
    token: "m_pp7f78gpyd7kmxkbsp6x9vngqg12gc",
    text: "",
  },
  {
    title: "Cherry Blossom",
    defaultVideo: "/resources/videos/remix/cherry_blossom_result.mp4",
    hoverVideo: "/resources/videos/remix/cherry_blossom_raw.mp4",
    token: "m_97xhpc7dt7xnfwj7paxg94mt95dshv",
    text: "",
  },
  {
    title: "Pirate Ship",
    defaultVideo: "/resources/videos/remix/pirate_ship_result.mp4",
    hoverVideo: "/resources/videos/remix/pirate_ship_raw.mp4",
    token: "m_tz8vm3vw3xsk5z5qvpq1y9cczdn2vp",
    text: "",
  },
  {
    title: "Cute Ghost",
    defaultVideo: "/resources/videos/remix/cute_ghost_result.mp4",
    hoverVideo: "/resources/videos/remix/cute_ghost_raw.mp4",
    token: "m_6vcp2d5k2k9k0xmz6hm6r5vtr1vexx",
    text: "",
  },
  {
    title: "Japanese Schoolyard",
    defaultVideo: "/resources/videos/remix/japanese_schoolyard_result.mp4",
    hoverVideo: "/resources/videos/remix/japanese_schoolyard_raw.mp4",
    token: "m_ftp3v0jgegtp6rsck4v8x5wm4vwvr1",
    text: "",
  },
  {
    title: "Desert Walk",
    defaultVideo: "/resources/videos/remix/desert_walk_result.mp4",
    hoverVideo: "/resources/videos/remix/desert_walk_raw.mp4",
    token: "m_nhh5fym68sab83yg3a0z7hhm40p4jc",
    text: "",
  },
];
export const Remix = () => {
  useSignals();

  const [loading, setLoading] = useState(true);

  // This is a 500ms delay fix for the layout shifting
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {loading ? (
        <div className="flex h-52 w-full items-center justify-center gap-3 font-medium">
          <LoadingSpinner />
          Loading Scenes...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 overflow-y-auto">
          {cards.map((card) => (
            <RemixVideo card={card} key={card.token} />
          ))}
        </div>
      )}
    </div>
  );
};
