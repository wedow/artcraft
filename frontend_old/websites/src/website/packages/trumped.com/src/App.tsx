import "./App.scss";
import React from "react";
import { Footer } from "./navigation/Footer";
import { HelpWantedComponent } from "./modes/help_wanted/HelpWantedComponent";
import { Mode } from "./AppMode";
import { NewsComponent } from "./modes/news/NewsComponent";
import { SpeakComponent } from "./modes/speak/SpeakComponent";
import { TermsComponent } from "./modes/terms/TermsComponent";
import { TopNav } from "./navigation/TopNav";
import { UsageComponent } from "./modes/usage/UsageComponent";

interface Props {}

interface State {
  mode: Mode;
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      mode: Mode.SPEAK_MODE,
    };
  }

  switchMode = (mode: Mode) => {
    this.setState({ mode: mode });
  };

  resetMode = () => {
    this.setState({ mode: Mode.SPEAK_MODE });
  };

  public render() {
    let component;
    switch (this.state.mode) {
      case Mode.SPEAK_MODE:
        component = <SpeakComponent />;
        break;
      case Mode.USAGE_MODE:
        component = <UsageComponent resetModeCallback={this.resetMode} />;
        break;
      case Mode.NEWS_MODE:
        component = <NewsComponent resetModeCallback={this.resetMode} />;
        break;
      case Mode.HELP_WANTED_MODE:
        component = <HelpWantedComponent resetModeCallback={this.resetMode} />;
        break;
      case Mode.TERMS_MODE:
        component = <TermsComponent resetModeCallback={this.resetMode} />;
        break;
    }
    return (
      <div id="main" className="container">
        <div id="viewable">
          <TopNav mode={this.state.mode} switchModeCallback={this.switchMode} />
          {component}
          <Footer mode={this.state.mode} switchModeCallback={this.switchMode} />
        </div>
      </div>
    );
  }
}

export default App;
