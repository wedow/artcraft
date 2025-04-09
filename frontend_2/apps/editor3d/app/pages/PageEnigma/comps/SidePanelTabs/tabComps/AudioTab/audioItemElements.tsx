import { useSignals } from "@preact/signals-react/runtime";
import { isRetreivingAudioItems } from "~/signals";
import { AudioItemElement } from "./audioItemElement";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AudioMediaItem } from "~/pages/PageEnigma/models";
import { H4, H6, P } from "~/components";

interface Props {
  currentPage: number;
  pageSize: number;
  items: AudioMediaItem[];
}

export const AudioItemElements = ({ currentPage, pageSize, items }: Props) => {
  useSignals();
  if (isRetreivingAudioItems.value) {
    return (
      <div className="grid grid-cols-1 gap-2.5">
        <FontAwesomeIcon icon={faSpinnerThird} spin />
        <H6>Retreiving New Audio Items</H6>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="text-center">
        <br />
        <H4> You do not have audio clips. </H4>
        <br />
        <P>
          You can upload some assets, or try generating some using{" "}
          <b>Generate Audio</b>.
        </P>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2.5">
      {items
        .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
        .map((item) => (
          <AudioItemElement key={item.media_id} item={item} />
        ))}
    </div>
  );
};
