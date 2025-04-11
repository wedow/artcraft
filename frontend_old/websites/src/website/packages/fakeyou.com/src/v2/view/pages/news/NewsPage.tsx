import React, { useEffect } from "react";
import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import { TwitchPlayer, TwitchChat } from "react-twitch-embed";
import { Link } from "react-router-dom";
import { WebUrl } from "../../../../common/WebUrl";
import { DiscordLink2 } from "@storyteller/components/src/elements/DiscordLink2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/pro-solid-svg-icons";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { useSession } from "hooks";

//interface StreamInfo {
//  broadcaster_name: string;
//  title: string;
//}
//
//interface ChannelInfo {
//  profile_image_url: string;
//  description: string;
//  login: string;
//}
//
//interface ViewerCount {
//  viewer_count: number;
//}

//let twitchApi = axios.create({
//  headers: {
//    "Client-ID": "8s2gjp7ora3zswgjabz1svoi24ting",
//    Authorization: "Bearer 10uyyp7l6n21zlezht8vvv25uvenu3",
//  },
//});

const TWITCH_CHANNEL = "FakeYouLabs";

export default function NewsPage() {
  const { sessionSubscriptions } = useSession();
  usePrefixedDocumentTitle("AI News");
  PosthogClient.recordPageview();

  //const [stream, setStream] = useState<StreamInfo>({
  //  broadcaster_name: "",
  //  title: "",
  //});

  //const [channel, setChannel] = useState<ChannelInfo>({
  //  profile_image_url: "",
  //  description: "",
  //  login: "",
  //});

  //const [viewerCount, setViewerCount] = useState<ViewerCount>({
  //  viewer_count: 0,
  //});

  useEffect(() => {
    console.log("useEffect() triggered");
    const fetchData = async () => {
      //const streamInfo = await twitchApi.get(
      //  "https://api.twitch.tv/helix/channels?broadcaster_id=650154491"
      //);
      //setStream(streamInfo.data.data[0]);
      //const channelInfo = await twitchApi.get(
      //  "https://api.twitch.tv/helix/users?login=testytest512"
      //);
      //setChannel(channelInfo.data.data[0]);
      //const viewerCountInfo = await twitchApi.get(
      //  "https://api.twitch.tv/helix/streams?user_login=testytest512"
      //);
      //setViewerCount(viewerCountInfo.data.data[0]);
    };
    fetchData();
  });

  //let twitchChannelLink = "https://twitch.tv/" + channel.login;

  //// if (viewerCount !== undefined) {
  ////   console.log("helllooo");
  //// } else {
  ////   let viewerCountNumber = viewerCount.viewer_count.toString();
  //// }
  //let viewCountNumber = "Offline";
  //if (viewerCount !== undefined) {
  //  viewCountNumber = viewerCount.viewer_count.toString();
  //}

  let subscriberPart = <></>;
  let subscribeButton = <></>;
  if (!sessionSubscriptions?.hasPaidFeatures()) {
    subscriberPart = (
      <p>
        If you'd like an ad-free experience,{" "}
        <Link to={WebUrl.pricingPage()}>please subscribe</Link>!
      </p>
    );

    subscribeButton = (
      <div className="mx-3 mx-md-0">
        <Link to="/pricing" className="btn btn-primary w-100">
          <FontAwesomeIcon icon={faStar} className="me-2" />
          Subscribe to FakeYou
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="container-panel py-1 py-lg-4 px-md-4 px-lg-5 px-xl-3">
        <div className="row gx-3 gy-3">
          <div className="col-12 col-lg-8 d-flex flex-column gap-3">
            {/* <div className="d-flex flex-column ms-3 ms-lg-0">
              <h1 className="fw-bold" >
                Media Feed
              </h1>
            </div> */}

            {/* Feed Content */}
            <div className="d-flex flex-column gap-3">
              <TwitchPlayer
                channel={TWITCH_CHANNEL}
                width="100%"
                height="100%"
                autoplay
                muted={false}
                className="twitch-video-container"
              />
              {/*
              <div className="row align-items-center px-3 px-md-0">
                <div className="col-12 col-lg-9 d-flex gap-3">
                  <a href={twitchChannelLink}>
                    <img
                      src={channel.profile_image_url}
                      alt="profile"
                      width="60"
                      height="60"
                      className="channel-image rounded-circle"
                    />
                  </a>

                  <div className="d-flex flex-column">
                    <p className="fw-medium channel-title">
                      {stream.broadcaster_name}
                    </p>
                    <p className="fw-medium opacity-75 stream-title">
                      {stream.title}
                    </p>
                  </div>
                </div>
                <div className="col-12 col-lg-3 d-flex justify-content-lg-end h-100">
                  <p className="fw-medium view-count pe-3 d-none d-lg-block">
                    <FontAwesomeIcon icon={faEye} className="me-2" />
                    {viewCountNumber}
                  </p>
                </div>
              </div>
             */}

              {subscribeButton}

              <div className="panel d-flex flex-column gap-3 p-3 channel-description">
                {subscriberPart}
                <p>
                  We've built a powerful new AI animation system that we're
                  nearly ready to unveil. For now, enjoy this teaser tech demo
                  of a 24/7 streaming news channel. This is a tech demo and may
                  occasionally report factually incorrect information.
                </p>
                <p>
                  Want to give us feedback? Please join our <DiscordLink2 />.
                </p>
              </div>
            </div>
          </div>

          {/* Side column */}
          <div className="col-12 col-lg-4 flex-column gap-3">
            <TwitchChat
              channel={TWITCH_CHANNEL}
              darkMode
              width="100%"
              className="twitch-chat-container"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
