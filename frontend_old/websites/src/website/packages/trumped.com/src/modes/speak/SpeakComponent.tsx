import React from "react";
import { Animation } from "./Animation";
import { Form } from "./Form";
import { StatusText } from "./StatusText";
import { getRandomInt } from "../../Utils";

enum StatusState {
  NONE,
  INFO,
  WARN,
  ERROR,
}

interface Props {}

interface State {
  statusState: StatusState;
  statusMessage: string;
  isTalking: boolean;
}

class SpeakComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      statusState: StatusState.NONE,
      statusMessage: "",
      isTalking: false,
    };
  }

  setMessage = (statusState: StatusState, message: string) => {
    this.setState({
      statusState: statusState,
      statusMessage: message,
    });
  };

  setHintMessage = (message: string) => {
    this.setMessage(StatusState.INFO, message);
  };

  clearMessage = () => {
    this.setState({
      statusState: StatusState.NONE,
      statusMessage: "",
    });
  };

  onSpeakRequest = () => {
    let message;
    switch (getRandomInt(0, 4)) {
      case 0:
        message = "Requesting...";
        break;
      case 1:
        message = "Sending...";
        break;
      case 3:
        message = "Calculating...";
        break;
      case 4:
      default:
        message = "Inferring...";
        break;
    }
    this.setMessage(StatusState.INFO, message);
  };

  onSpeakSuccess = () => {
    let message;
    switch (getRandomInt(0, 4)) {
      case 0:
        message = "Success!";
        break;
      case 1:
        message = "Playing.";
        break;
      case 3:
        message = "Here's some Trump audio.";
        break;
      case 4:
      default:
        message = "Got it.";
        break;
    }
    this.setMessage(StatusState.INFO, message);
  };

  onSpeakError = () => {
    this.setMessage(
      StatusState.ERROR,
      "There was an error. Perhaps you sent too much text or the server is busy. Try again."
    );
  };

  onPlay = () => {
    this.setState({ isTalking: true });
  };

  onStop = () => {
    this.setState({ isTalking: false });
  };

  public render() {
    return (
      <div className="d-flex flex-column align-items-center">
        <Animation isTalking={this.state.isTalking} />
        <StatusText
          statusState={this.state.statusState}
          statusMessage={this.state.statusMessage}
        />
        <Form
          clearStatusCallback={this.clearMessage}
          setHintMessage={this.setHintMessage}
          onSpeakRequestCallback={this.onSpeakRequest}
          onSpeakSuccessCallback={this.onSpeakSuccess}
          onSpeakErrorCallback={this.onSpeakError}
          onPlayCallback={this.onPlay}
          onStopCallback={this.onStop}
        />
      </div>
    );
  }
}

export { SpeakComponent, StatusState };
