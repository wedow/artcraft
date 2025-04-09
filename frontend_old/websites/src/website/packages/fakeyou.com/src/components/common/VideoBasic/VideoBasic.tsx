import React, { useState } from "react";
import { a, useSpring } from "@react-spring/web";
import { useVideo } from "hooks";
import makeClass from "resources/makeClass";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import "./VideoBasic.scss"

interface Props {
  className?: string;
  src?: string;
  title?: string;
  description?: string;
}

export default function VideoBasic({
  className,
  src,
  title,
  description
}: Props) {
  const [tint,tintSet] = useState(true);
  const [{ playCtrl },vidProps] = useVideo({ onEnded: () => tintSet(true) });
  const style = useSpring({
    onRest: () => { if (!tint) { playCtrl!(tintSet) }},
    opacity: tint ? 1 : 0
  });
  const onClick = () => {
    tintSet(!tint)
    if (!tint) playCtrl!();
  };

  return <div {...{ ...makeClass("fy-basic-video",className) }}>
    <video {...{ playsInline: true, ...vidProps }}>
      <source {...{ src, type: "video/mp4" }} />
    </video>
    <a.div {...{ className: "video-overlay", onClick, style }}>
      {title && <h6>{title}</h6>}
      {description && <p>{description}</p>}
      <FontAwesomeIcon {...{ icon: faPlay }} />
    </a.div>
  </div>;
};