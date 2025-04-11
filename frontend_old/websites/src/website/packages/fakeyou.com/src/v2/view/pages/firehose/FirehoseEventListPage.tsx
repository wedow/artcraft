import React, { useState, useEffect, useRef } from "react";
import { ApiConfig } from "@storyteller/components";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faAward,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faDiscord,
  faTwitch,
} from "@fortawesome/free-brands-svg-icons";
import { duration, delay } from "../../../../data/animation";

import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import {
  faDownload,
  faMessageDots,
  faMicrophone,
  faQuoteLeft,
  faUpload,
  faVideo,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";

const Fade = require("react-reveal/Fade");

interface FirehoseEventListResponsePayload {
  success: boolean;
  events: Array<FirehoseEvent>;
}

interface FirehoseEvent {
  event_token: string;
  event_type: string;

  maybe_target_user_info?: TargetUserInfo;

  maybe_target_user_token?: string;
  maybe_target_username?: string;
  maybe_target_display_name?: string;
  maybe_target_user_gravatar_hash?: string;
  maybe_target_entity_token?: string;
  created_at: string;
  updated_at: string;
}

interface TargetUserInfo {
  user_token: string;
  username: string;
  display_name: string;
  gravatar_hash: string;
  default_avatar_index: number;
  default_avatar_color_index: number;
}

export default function FirehoseEventListPage() {
  const [firehoseEvents, setFirehoseEvents] = useState<Array<FirehoseEvent>>(
    []
  );

  const fetchEvents = () => {
    const api = new ApiConfig();
    const endpointUrl = api.firehoseEvents();
    PosthogClient.recordPageview();

    fetch(endpointUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then(res => res.json())
      .then(res => {
        const firehoseResponse: FirehoseEventListResponsePayload = res;
        if (!firehoseResponse.success) {
          return;
        }

        setFirehoseEvents(firehoseResponse.events);
      })
      .catch(e => {
        // ignored
      });
  };

  const componentIsMounted = useRef(true);

  const doSetTimeout = () => {
    fetchEvents();
    if (componentIsMounted.current) {
      setTimeout(doSetTimeout, 5000);
    }
  };

  useEffect(() => {
    doSetTimeout();
    return () => {
      componentIsMounted.current = false;
    };
    // NB: This is a valid use case
    // eslint-disable-next-line
  }, []); // NB: Empty array dependency sets to run ONLY on mount

  let eventItems: Array<JSX.Element> = [];

  firehoseEvents.slice(0, 16).forEach(event => {
    let inner = <span />;
    let userLink = <span>Anonymous user</span>;
    let gravatar = (
      <div className="me-2">
        <Gravatar
          size={32}
          username={event.maybe_target_username}
          email_hash={event.maybe_target_user_gravatar_hash}
          avatarIndex={event.maybe_target_user_info?.default_avatar_index || 0}
          backgroundIndex={
            event.maybe_target_user_info?.default_avatar_color_index
          }
        />
      </div>
    );

    if (
      event.maybe_target_username !== undefined &&
      event.maybe_target_username !== null &&
      event.maybe_target_user_token !== undefined &&
      event.maybe_target_user_token !== null
    ) {
      let link = `/profile/${event.maybe_target_username}`;
      userLink = <Link to={link}>{event.maybe_target_display_name}</Link>;
      gravatar = (
        <div className="me-2">
          <Gravatar
            size={32}
            username={event.maybe_target_username}
            email_hash={event.maybe_target_user_gravatar_hash}
            avatarIndex={
              event.maybe_target_user_info?.default_avatar_index || 0
            }
            backgroundIndex={
              event.maybe_target_user_info?.default_avatar_color_index
            }
          />
        </div>
      );
    }

    switch (event.event_type) {
      case "user_sign_up":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faPenToSquare} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;signed up for FakeYou!
          </span>
        );
        break;
      case "user_badge_granted":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faAward} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;got a badge!
          </span>
        );
        break;
      case "tts_model_upload_started":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faMessageDots} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;started TTS model upload
          </span>
        );
        break;
      case "tts_model_upload_completed":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faMessageDots} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;completed TTS model upload
          </span>
        );
        break;
      case "tts_inference_started":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faMessageDots} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;started TTS
          </span>
        );
        break;
      case "tts_inference_completed":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faMessageDots} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;completed TTS
          </span>
        );
        break;
      case "w2l_template_upload_started":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faPlay} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;started uploading a lipsync template.
          </span>
        );
        break;
      case "w2l_template_upload_completed":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faVideo} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;finished uploading a lipsync template.
          </span>
        );
        break;
      case "w2l_inference_started":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faVideo} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;started a W2L lipsync video
          </span>
        );
        break;
      case "w2l_inference_completed":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faVideo} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;completed a W2L lipsync video
          </span>
        );
        break;
      case "twitter_mention":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faTwitter} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;mentioned us on twitter!
          </span>
        );
        break;
      case "twitter_retweet":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faTwitter} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;retweeted us!
          </span>
        );
        break;
      case "discord_join":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faDiscord} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;joined discord!
          </span>
        );
        break;
      case "discord_message":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faDiscord} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;sent a discord message
          </span>
        );
        break;
      case "twitch_subscribe":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faTwitch} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;subscribed to us on twitch!
          </span>
        );
        break;
      case "twitch_follow":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faTwitch} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;followed us on twitch!
          </span>
        );
        break;
      case "vc_inference_started":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faWaveformLines} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;started a voice conversion
          </span>
        );
        break;
      case "vc_inference_completed":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faWaveformLines} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;completed a voice conversion
          </span>
        );
        break;
      case "generic_download_started":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faDownload} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;downloaded
          </span>
        );
        break;
      case "generic_download_completed":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faDownload} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;completed a download
          </span>
        );
        break;
      case "media_uploaded":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faUpload} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;uploaded a media file
          </span>
        );
        break;
      case "device_media_recorded":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faMicrophone} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;recorded an audio/video
          </span>
        );
        break;
      case "comment_created":
        inner = (
          <span className="d-flex align-items-center">
            <FontAwesomeIcon icon={faQuoteLeft} className="me-3" />
            {gravatar}
            {userLink}
            &nbsp;added a comment
          </span>
        );
        break;
      default:
        return;
    }

    eventItems.push(
      <li className="panel p-3 p-lg-3" key={event.event_token}>
        {inner}
      </li>
    );
  });

  usePrefixedDocumentTitle("Firehose Event Feed");

  return (
    <div>
      <div className="container py-5 px-md-4 px-lg-5 px-xl-3">
        <div className="d-flex flex-column">
          <h1 className=" fw-bold">Firehose Event Feed</h1>
          <h4 className="mb-4">
            The latest FakeYou events refreshed every few seconds.
          </h4>
          <p className="lead">
            As you can see, we're really popular. But we owe it to you, our
            users. Thank you!
          </p>
        </div>
      </div>

      <div className="container-panel pb-5">
        <Fade right cascade delay={delay} duration={duration} distance="100px">
          <ul className="firehose-ul d-flex flex-column gap-3">{eventItems}</ul>
        </Fade>
      </div>
    </div>
  );
}
