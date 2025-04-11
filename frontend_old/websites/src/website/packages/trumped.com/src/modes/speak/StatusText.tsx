import React from 'react';
import { StatusState } from './SpeakComponent';

interface Props {
  statusState: StatusState;
  statusMessage: string,
}

interface State {}

class StatusText extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    let className;

    switch (this.props.statusState) {
      case StatusState.INFO:
        className = 'info';
        break;
      case StatusState.WARN:
        className = 'warn';
        break;
      case StatusState.ERROR:
        className = 'error';
        break;
    }

    return (
      <div id="status">
        <p className={className}>{this.props.statusMessage}</p>
      </div>
    );
  }
}

export { StatusText };
