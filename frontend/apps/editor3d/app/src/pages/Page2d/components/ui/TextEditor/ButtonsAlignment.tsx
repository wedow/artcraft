import {
  faAlignCenter,
  // faAlignJustify,
  faAlignLeft,
  faAlignRight,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TextAlign } from "../../../TextTypes";
import { buttonGroupButton, buttonGroupGrouper } from "./styles";
export const ButtonsAlignments = ({
  value,
  onChange,
}: {
  value: TextAlign;
  onChange: (newVal: TextAlign) => void;
}) => {
  const isSelected = (alignment: TextAlign) =>
    value === alignment ? true : undefined;
  return (
    <div className={buttonGroupGrouper}>
      <button
        data-selected={isSelected(TextAlign.LEFT)}
        className={buttonGroupButton}
        onClick={() => onChange(TextAlign.LEFT)}
      >
        <FontAwesomeIcon icon={faAlignLeft} />
      </button>
      <button
        data-selected={isSelected(TextAlign.CENTER)}
        className={buttonGroupButton}
        onClick={() => onChange(TextAlign.CENTER)}
      >
        <FontAwesomeIcon icon={faAlignCenter} />
      </button>
      <button
        data-selected={isSelected(TextAlign.RIGHT)}
        className={buttonGroupButton}
        onClick={() => onChange(TextAlign.RIGHT)}
      >
        <FontAwesomeIcon icon={faAlignRight} />
      </button>
    </div>
  );
};
