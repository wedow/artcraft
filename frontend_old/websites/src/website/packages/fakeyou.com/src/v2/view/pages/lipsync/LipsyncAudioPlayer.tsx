import React, { useCallback, useState } from "react";
import Wavesurfer from "react-wavesurfer.js";

interface Props {
  filename: string;
  play: boolean;
  onFinish?: () => void;
}

function LipsyncAudioPlayer(props: Props) {
  const [position, setPosition] = useState(0);

  const handleFinish = useCallback(() => {
    setPosition(0);
    props.onFinish && props.onFinish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onFinish]);

  return (
    <div className="flex-grow-1 h-100 overflow-hidden w-100">
      <Wavesurfer
        onFinish={handleFinish}
        pos={position}
        src={props.filename || ""}
        height={100}
        progressColor="#fc8481"
        waveColor="#b09e9e"
        cursorColor="#fc8481"
        playing={props.play}
        responsive={true}
        normalize={true}
      />
    </div>
  );
}

export default React.memo(LipsyncAudioPlayer);
