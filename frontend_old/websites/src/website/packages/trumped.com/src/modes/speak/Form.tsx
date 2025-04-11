import Howl from "howler";
import React from "react";
import { getRandomInt } from "../../Utils";

const AUDIO_FILES = ["/wav/fakeyou_1.wav", "/wav/fakeyou_2.wav"];

interface Props {
  clearStatusCallback: () => void;
  setHintMessage: (message: string) => void;
  onSpeakRequestCallback: () => void;
  onSpeakSuccessCallback: () => void;
  onSpeakErrorCallback: () => void;
  onPlayCallback: () => void;
  onStopCallback: () => void;
}

interface State {
  text: string;
  howl?: Howl.Howl;
}

class Form extends React.Component<Props, State> {
  textarea: HTMLTextAreaElement | null | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      text: "",
    };
  }

  componentDidMount() {
    this.textarea?.focus();
  }

  public speak(_sentence: string, _speaker: string) {
    let that = this;

    this.props.onSpeakSuccessCallback();

    const i = getRandomInt(0, AUDIO_FILES.length);
    const url = AUDIO_FILES[i];

    const sound = new Howl.Howl({
      src: [url],
      // NB: Attempting to get this working on iPhone Safari
      // https://github.com/goldfire/howler.js/issues/1093
      // Other issues cite needing to cache a single player
      // across all user interaction events.
      html5: true,
      onplay: () => {
        that.props.onPlayCallback();
      },
      onend: () => {
        that.props.onStopCallback();
      },
    });

    this.setState({ howl: sound });
    sound.play();

    (window as any).sound = sound;
  }

  clear() {
    this.setState({ text: "" });
  }

  handleTextChange = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const text = (ev.target as HTMLTextAreaElement).value;

    let pseudoWords = text.split(" ");

    if (text.length > 0) {
      if (pseudoWords.length > 0 && pseudoWords.length < 4) {
        this.props.setHintMessage(
          "Hint: It sounds better when you type more words."
        );
      } else if (pseudoWords.length > 5) {
        this.props.setHintMessage(
          "Hint: Use the ESC key to clear if you're on your computer."
        );
      }
    } else {
      this.props.clearStatusCallback();
    }

    this.setState({ text: text });
  };

  handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>): boolean => {
    ev.preventDefault();
    this.speak(this.state.text, "donald-trump");
    return false;
  };

  handleCancelClick = (ev: React.FormEvent<HTMLButtonElement>): boolean => {
    ev.preventDefault();
    this.clear();
    return false;
  };

  handleKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (ev.keyCode === 27) {
      // Escape key
      this.clear();
    }
    return true;
  };

  public render() {
    return (
      <div className="form-container">
        <form onSubmit={this.handleFormSubmit}>
          <textarea
            onChange={this.handleTextChange}
            onKeyDown={this.handleKeyDown}
            value={this.state.text}
            ref={(textarea) => {
              this.textarea = textarea;
            }}
            className="w-100"
            rows={3}
          />
          <div className="d-flex gap-3 justify-content-center mt-3">
            <button className="w-100">Speak</button>
            <button className="w-100" onClick={this.handleCancelClick}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }
}

export { Form };
