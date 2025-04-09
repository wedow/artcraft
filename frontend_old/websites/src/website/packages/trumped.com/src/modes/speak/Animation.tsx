import * as PIXI from 'pixi.js';
import React from 'react';
import {
  Stage,
  Sprite,
  Container,
} from '@inlet/react-pixi';
import { Trump } from './TrumpSprite';
import { getRandomInt } from '../../Utils';

const logoImage = '/images/trumped.png';

enum AnimationState {
  IDLE,

  // Simple blink
  BLINKING_ANIMATION,

  // Angrily talking
  ANGRILY_TALKING_START_ANIMATION,
  ANGRILY_TALKING_CONTINUOUS_ANIMATION,
  ANGRILY_TALKING_STOP_ANIMATION,

  // Regular talking
  REGULAR_TALKING_START_ANIMATION,
  REGULAR_TALKING_CONTINUOUS_ANIMATION,
  REGULAR_TALKING_STOP_ANIMATION,
}

interface Props {
  isTalking: boolean,
}

interface State {
  animationState: AnimationState,
  frameNumber: number,
}

class Animation extends React.Component<Props, State> {

  stage: PIXI.Container;
  renderer: PIXI.Renderer;
  logoTexture: PIXI.Texture;

  constructor(props: Props) {
    super(props);

    this.state = {
      animationState: AnimationState.IDLE,
      frameNumber: 0,
    };

    this.renderer = PIXI.autoDetectRenderer({ width: 800, height: 470 });
    this.stage = new PIXI.Container();

    this.logoTexture = PIXI.Texture.from(logoImage);
  }
  
  componentDidMount() {
    this.blinkAnimationTimer();
  }

  blinkAnimationTimer = () => {
    this.startBlink();
    let nextBlink = getRandomInt(1000, 4000);
    setTimeout(this.blinkAnimationTimer, nextBlink);
  }

  startBlink = () => {
    if (this.state.animationState === AnimationState.IDLE) {
      this.setState({ animationState: AnimationState.BLINKING_ANIMATION });
    }
  }

  stopBlink = () => {
    if (this.state.animationState === AnimationState.BLINKING_ANIMATION) {
      this.setState({ animationState: AnimationState.IDLE })
    }
  }

  // Called by Howl.js sound playback callback (componentDidUpdate)
  startTalking = () => {
    if (Math.random() >= 0.5) {
      this._startRegularTalking();
    } else {
      this._startAngryTalking();
    }
  }

  // Called by Howl.js sound playback callback (componentDidUpdate)
  stopTalking = () => {
    switch (this.state.animationState) {
      case AnimationState.ANGRILY_TALKING_START_ANIMATION:
      case AnimationState.ANGRILY_TALKING_CONTINUOUS_ANIMATION:
        this.setState({ animationState: AnimationState.ANGRILY_TALKING_STOP_ANIMATION });
        break;
      case AnimationState.REGULAR_TALKING_START_ANIMATION:
      case AnimationState.REGULAR_TALKING_CONTINUOUS_ANIMATION:
        this.setState({ animationState: AnimationState.REGULAR_TALKING_STOP_ANIMATION });
        break;
    }
  }

  // Delegated by `startTalking()` above
  _startAngryTalking = () => {
    switch (this.state.animationState) {
      case AnimationState.IDLE:
      case AnimationState.BLINKING_ANIMATION: // TODO - is this possible?
        this.setState({ animationState: AnimationState.ANGRILY_TALKING_START_ANIMATION });
        break;
    }
  }

  // Delegated by `startTalking()` above
  _startRegularTalking = () => {
    switch (this.state.animationState) {
      case AnimationState.IDLE:
      case AnimationState.BLINKING_ANIMATION: // TODO - is this possible?
        this.setState({ animationState: AnimationState.REGULAR_TALKING_START_ANIMATION });
        break;
    }
  }

  // Transition called by sprite.
  loopTalking = () => {
    switch (this.state.animationState) {
      case AnimationState.ANGRILY_TALKING_START_ANIMATION:
      case AnimationState.ANGRILY_TALKING_CONTINUOUS_ANIMATION:
        this.setState({ animationState: AnimationState.ANGRILY_TALKING_CONTINUOUS_ANIMATION });
        break;
      case AnimationState.REGULAR_TALKING_START_ANIMATION:
      case AnimationState.REGULAR_TALKING_CONTINUOUS_ANIMATION:
        this.setState({ animationState: AnimationState.REGULAR_TALKING_CONTINUOUS_ANIMATION });
        break;
    }
  }

  // Transition called by sprite.
  doneTalking = () => {
    switch (this.state.animationState) {
      case AnimationState.ANGRILY_TALKING_STOP_ANIMATION:
      case AnimationState.REGULAR_TALKING_STOP_ANIMATION:
        this.setState({ animationState: AnimationState.IDLE });
        break;
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.isTalking && !prevProps.isTalking) {
      this.startTalking();
    } else if (!this.props.isTalking && prevProps.isTalking) {
      this.stopTalking();
    }
  }

  public render() {
    const position = { x: 200, y: 0 };
    const scale = { x: 0.5, y: 0.5 };

    return (
      <div>
        <Stage 
          id={"animation"} 
          options={{ backgroundColor: 0xffffff }} 
          height={470} >
          <Sprite
            texture={this.logoTexture}
            scale={{ x: 0.5, y: 0.5 }}
            position={{ x: 0, y: 160 }}
            />

          <Container position={position} scale={scale}>
            <Trump
              animationState={this.state.animationState}
              notifyStopBlinking={this.stopBlink}
              notifyLoopTalking={this.loopTalking}
              notifyDoneTalking={this.doneTalking}
              />
          </Container>
        </Stage>
      </div>
    );
  }
}

export { Animation, AnimationState };
