import {
  faBold,
  faItalic,
  faStrikethrough,
  faUnderline,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { buttonGroupButton, buttonGroupGrouper } from "./styles";
import { FontStyle, FontWeight, TextDecoration } from "../../../TextTypes";
export const ButtonsTextStyles = ({
  fontStyle: currStyle,
  fontWeight: currWeight,
  textDecoration: currDecoration,
  onChangeFontStyle,
  onChangeFontWeight,
  onChangeTextDecoration,
}: {
  fontStyle: FontStyle;
  fontWeight: FontWeight;
  textDecoration: TextDecoration;
  onChangeFontStyle: (newVal: FontStyle) => void;
  onChangeFontWeight: (newVal: FontWeight) => void;
  onChangeTextDecoration: (newVal: TextDecoration) => void;
}) => {
  const isBold = currWeight === FontWeight.BOLD ? true : undefined;
  const isItalic = currStyle === FontStyle.ITALIC ? true : undefined;
  const isSelectedDecoration = (buttonVal: TextDecoration) =>
    currDecoration === buttonVal ? true : undefined;

  const toggleBold = () => {
    if (currWeight === FontWeight.BOLD) {
      onChangeFontWeight(FontWeight.NORMAL);
    } else {
      onChangeFontWeight(FontWeight.BOLD);
    }
  };
  const handleOnChangeFontStyle = (selected: FontStyle) => {
    if (selected === currStyle) {
      onChangeFontStyle(FontStyle.NORMAL);
    } else {
      onChangeFontStyle(selected);
    }
  };
  const handleOnChangeTextDecoration = (selected: TextDecoration) => {
    if (selected === currDecoration) {
      onChangeTextDecoration(TextDecoration.NONE);
    } else {
      onChangeTextDecoration(selected);
    }
  };
  return (
    <div className={buttonGroupGrouper}>
      <button
        data-selected={isBold}
        className={buttonGroupButton}
        onClick={toggleBold}
      >
        <FontAwesomeIcon icon={faBold} />
      </button>
      <button
        data-selected={isItalic}
        className={buttonGroupButton}
        onClick={() => handleOnChangeFontStyle(FontStyle.ITALIC)}
      >
        <FontAwesomeIcon icon={faItalic} />
      </button>
      <button
        data-selected={isSelectedDecoration(TextDecoration.STRIKETHROUGH)}
        className={buttonGroupButton}
        disabled
        onClick={() =>
          handleOnChangeTextDecoration(TextDecoration.STRIKETHROUGH)
        }
      >
        <FontAwesomeIcon icon={faStrikethrough} />
      </button>
      <button
        data-selected={isSelectedDecoration(TextDecoration.UNDERLINE)}
        className={buttonGroupButton}
        disabled
        onClick={() => handleOnChangeTextDecoration(TextDecoration.UNDERLINE)}
      >
        <FontAwesomeIcon icon={faUnderline} />
      </button>
    </div>
  );
};
