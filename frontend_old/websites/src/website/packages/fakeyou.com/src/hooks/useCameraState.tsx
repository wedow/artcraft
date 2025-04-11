import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useInterval } from "hooks";
import { RecordToggleEvent } from "components/common";

type CameraBlob = Blob | null;

export interface CameraState {
  blob: CameraBlob;
  capturing: boolean;
  counter: number;
  ref: RefObject<Webcam>;
  reset: () => void;
  started: boolean;
  startedSet: (startedState: boolean) => void;
  toggle: (e: RecordToggleEvent) => void;
}

export default function useCameraState(autoCapture = false): CameraState {
  const ref = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [blob, blobSet] = useState<CameraBlob>(null);
  const [started, startedSet] = useState(false);
  const [counter, counterSet] = useState(0);
  const [capturing, capturingSet] = useState(false);
  const [recordedChunks, recordedChunksSet] = useState([]);
  const [autoTriggered, autoTriggeredSet] = useState(false);

  // useEffect will only update when watching the stream value directly

  const stream = ref?.current?.stream;

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        recordedChunksSet(prev => prev.concat(data));
      }
    },
    [recordedChunksSet]
  );

  const startCapture = useCallback(
    current => {
      capturingSet(true);

      if (current && current.stream) {
        mediaRecorderRef.current = new MediaRecorder(current.stream, {
          mimeType: "video/mp4",
        });

        mediaRecorderRef.current.addEventListener(
          "dataavailable",
          handleDataAvailable
        );
        mediaRecorderRef.current.start();
      }
    },
    [handleDataAvailable]
  );

  const toggle = ({ target }: RecordToggleEvent) => {
    if (target.value && ref.current) {
      startCapture(ref.current);
    } else {
      capturingSet(false);

      if (mediaRecorderRef.current !== null) {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const reset = () => {
    startedSet(false);
    blobSet(null);
    recordedChunksSet([]);
    counterSet(0);
  };

  useInterval({
    eventProps: { capturing, counter },
    interval: 1000,
    locked: !capturing,
    onTick: () => {
      if (capturing) {
        counterSet(currentCounter => currentCounter + 1);
      }
    },
  });

  useEffect(() => {
    if (!blob && !capturing && recordedChunks.length) {
      blobSet(
        new Blob(recordedChunks, {
          type: "video/mp4",
        })
      );
    }

    if (autoCapture && !capturing && !autoTriggered && ref.current && stream) {
      autoTriggeredSet(true);
      startCapture(ref.current);
    }
  }, [
    autoCapture,
    autoTriggered,
    blob,
    capturing,
    recordedChunks,
    startCapture,
    stream,
  ]);

  return { blob, capturing, counter, ref, reset, started, startedSet, toggle };
}
