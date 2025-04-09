import * as PIXI from 'pixi.js';
import { PixiComponent } from '@inlet/react-pixi';
import { AnimationState } from './Animation';

const idleImages = [
  '/images/trumpette/idle_0.png', // 0
  '/images/trumpette/idle_1.png', // 1
  '/images/trumpette/idle_2.png', // 2
  '/images/trumpette/idle_3.png', // 3
  '/images/trumpette/idle_4.png', // 4
];

const talkImages = [
  '/images/trumpette/talk_0.png', // 5
  '/images/trumpette/talk_1.png', // 6
  '/images/trumpette/talk_2.png', // 7
  '/images/trumpette/talk_3.png', // 8
  '/images/trumpette/talk_4.png', // 9
  '/images/trumpette/talk_5.png', // 10
  '/images/trumpette/talk_6.png', // 11
  '/images/trumpette/talk_7.png', // 12
  '/images/trumpette/talk_8.png', // 13
];

const angryImages = [
  '/images/trumpette/angry_0.png', // 14
  '/images/trumpette/angry_1.png', // 15
  '/images/trumpette/angry_2.png', // 16
  '/images/trumpette/angry_3.png', // 17
  '/images/trumpette/angry_4.png', // 18
  '/images/trumpette/angry_5.png', // 19
  '/images/trumpette/angry_6.png', // 20
  '/images/trumpette/angry_7.png', // 21
  '/images/trumpette/angry_8.png', // 22
  '/images/trumpette/angry_between.png', // 23
];

type AnimationProps = { 
  animationState: AnimationState,
  notifyStopBlinking: () => void,
  notifyLoopTalking: () => void,
  notifyDoneTalking: () => void,
};

class AnimationManager {

  container: PIXI.Container;
  animationState: AnimationState;
  isStarted: boolean;
  animationStartTimestamp: number;
  notifyStopBlinking: () => void;
  notifyLoopTalking: () => void;
  notifyDoneTalking: () => void;

  constructor(container: PIXI.Container, notifyStopBlinking: any, notifyLoopTalking: any, notifyDoneTalking: any) {
    this.animationState = AnimationState.IDLE;
    this.isStarted = false;
    this.container = container;
    this.animationStartTimestamp = Date.now();
    this.notifyStopBlinking = notifyStopBlinking;
    this.notifyLoopTalking = notifyLoopTalking;
    this.notifyDoneTalking = notifyDoneTalking;
  }

  public setAnimationState(animationState: AnimationState) {
    this.animationState = animationState;
  }

  public getIsStarted() : boolean {
    return this.isStarted;
  }

  public startAnimation() {
    if (this.isStarted) {
      return;
    }
    this.isStarted = true;
    this.startAnimationLoop();
  }

  public restartAnimationClock() {
    this.animationStartTimestamp  = Date.now();
  }

  startAnimationLoop = () => {
    // TODO: Don't need a closure anymore
    let animationLoop = () => {
      let animation: PIXI.AnimatedSprite; 
      let currentClock: number;
      let delta: number;

      let frame_rate = 30; // Updated below when necessary.

      switch (this.animationState) {
        case AnimationState.BLINKING_ANIMATION:
          this.container.children[1].visible = false;
          this.container.children[2].visible = false;
          animation = this.container.children[0] as PIXI.AnimatedSprite;
          animation.visible = true;

          currentClock = Date.now();
          delta = currentClock - this.animationStartTimestamp;

          if (delta > 200) {
            animation.gotoAndStop(0);
            this.notifyStopBlinking();
          } else if (delta > 150) {
            animation.gotoAndStop(4);
          } else if (delta > 60) {
            animation.gotoAndStop(3);
          } else if (delta > 20) {
            animation.gotoAndStop(2);
          } else if (delta > 10) {
            animation.gotoAndStop(0);
          }
          break;

        case AnimationState.ANGRILY_TALKING_START_ANIMATION:
          this.container.children[0].visible = false;
          this.container.children[1].visible = false;
          animation = this.container.children[2] as PIXI.AnimatedSprite;
          animation.visible = true;

          currentClock = Date.now();
          delta = currentClock - this.animationStartTimestamp;

          if (delta > 250) {
            animation.gotoAndStop(5); // 19
            this.notifyLoopTalking();
          } else if (delta > 200) {
            animation.gotoAndStop(4); // 18
          } else if (delta > 150) {
            animation.gotoAndStop(3); // 17
          } else if (delta > 60) {
            animation.gotoAndStop(2); // 16
          } else if (delta > 20) {
            animation.gotoAndStop(1); // 15
          } else if (delta > 10) {
            animation.gotoAndStop(0); // 14
          }
          break;

        case AnimationState.ANGRILY_TALKING_CONTINUOUS_ANIMATION:
          frame_rate = 90;
          this.container.children[0].visible = false;
          this.container.children[1].visible = false;
          animation = this.container.children[2] as PIXI.AnimatedSprite;
          animation.visible = true;

          currentClock = Date.now();

          delta = currentClock - this.animationStartTimestamp;
          if (delta > frame_rate * 6) {
            animation.gotoAndStop(5); // 19
            this.restartAnimationClock();
          } else if (delta > frame_rate * 5) {
            animation.gotoAndStop(6); // 20
          } else if (delta > frame_rate * 4) {
            animation.gotoAndStop(7); // 21
          } else if (delta > frame_rate * 3) {
            animation.gotoAndStop(8); // 22
          } else if (delta > frame_rate * 2) {
            animation.gotoAndStop(7); // 21
          } else if (delta > frame_rate * 1) {
            animation.gotoAndStop(6); // 20
          }
          break;

        case AnimationState.ANGRILY_TALKING_STOP_ANIMATION:
          this.container.children[0].visible = false;
          this.container.children[1].visible = false;
          animation = this.container.children[2] as PIXI.AnimatedSprite;
          animation.visible = true;

          currentClock = Date.now();
          delta = currentClock - this.animationStartTimestamp;

          // TODO: This is not a smooth animation and doesn't take into consideration 
          // the current frame from the previous loop animation state.
          if (delta > 100) {
            animation.gotoAndStop(0);
            this.notifyDoneTalking();
            animation.gotoAndStop(3); 
          } else if (delta > 50) {
            animation.gotoAndStop(4); 
          } else if (delta > 10) {
            animation.gotoAndStop(5); 
          }
          break;

        case AnimationState.REGULAR_TALKING_START_ANIMATION:
          this.container.children[0].visible = false;
          this.container.children[2].visible = false;
          animation = this.container.children[1] as PIXI.AnimatedSprite;
          animation.visible = true;

          // There is no startup animation for regular talking. Goes straight to loop.
          animation.gotoAndStop(0); // 6
          this.notifyLoopTalking();

          break;

        case AnimationState.REGULAR_TALKING_CONTINUOUS_ANIMATION:
          frame_rate = 40;
          this.container.children[0].visible = false;
          this.container.children[2].visible = false;
          animation = this.container.children[1] as PIXI.AnimatedSprite;
          animation.visible = true;

          currentClock = Date.now();

          delta = currentClock - this.animationStartTimestamp;
          if (delta > frame_rate * 14) {
            animation.gotoAndStop(1); // 7
            this.restartAnimationClock();
          } else if (delta > frame_rate * 13) {
            animation.gotoAndStop(2); // 8
          } else if (delta > frame_rate * 12) {
            animation.gotoAndStop(3); // 9
          } else if (delta > frame_rate * 11) {
            animation.gotoAndStop(4); // 10
          } else if (delta > frame_rate * 10) {
            animation.gotoAndStop(5); // 11
          } else if (delta > frame_rate * 9) {
            animation.gotoAndStop(6); // 12
          } else if (delta > frame_rate * 8) {
            animation.gotoAndStop(7); // 13
          } else if (delta > frame_rate * 7) {
            animation.gotoAndStop(6); // 12
          } else if (delta > frame_rate * 6) {
            animation.gotoAndStop(5); // 11
          } else if (delta > frame_rate * 5) {
            animation.gotoAndStop(4); // 10
          } else if (delta > frame_rate * 4) {
            animation.gotoAndStop(3); // 9 
          } else if (delta > frame_rate * 3) {
            animation.gotoAndStop(2); // 8
          } else if (delta > frame_rate * 2) {
            animation.gotoAndStop(1); // 7
          } else if (delta > frame_rate * 1) {
            animation.gotoAndStop(0); // 6
          }
          break;

        case AnimationState.REGULAR_TALKING_STOP_ANIMATION:
          this.container.children[0].visible = false;
          this.container.children[2].visible = false;
          animation = this.container.children[1] as PIXI.AnimatedSprite;
          animation.visible = true;

          currentClock = Date.now();
          delta = currentClock - this.animationStartTimestamp;

          // TODO: This is not a smooth animation and doesn't take into consideration 
          // the current frame from the previous loop animation state.
          if (delta > 100) {
            animation.gotoAndStop(0);
            this.notifyDoneTalking();
            animation.gotoAndStop(3); 
          } else if (delta > 50) {
            animation.gotoAndStop(4); 
          } else if (delta > 10) {
            animation.gotoAndStop(5); 
          }
          break;


        case AnimationState.IDLE:
        default:
          this.container.children[1].visible = false;
          this.container.children[2].visible = false;
          animation = this.container.children[0] as PIXI.AnimatedSprite;
          animation.visible = true;
          break;
      }
      requestAnimationFrame(animationLoop);
    }

    animationLoop();
  }
}

const Trump = PixiComponent<AnimationProps, PIXI.Container>('Trump', {

  create() {
    let container = new PIXI.Container();

    let blinkAnimation = PIXI.AnimatedSprite.fromImages(idleImages);
    let talkAnimation = PIXI.AnimatedSprite.fromImages(talkImages);
    let angryAnimation = PIXI.AnimatedSprite.fromImages(angryImages);

    blinkAnimation.visible = false;
    talkAnimation.visible = false;
    angryAnimation.visible = false;

    container.addChild(blinkAnimation);
    container.addChild(talkAnimation);
    container.addChild(angryAnimation);

    return container;
  },

  applyProps(container: PIXI.Container, oldProps: AnimationProps, newProps: AnimationProps) {
    let c = container as any;

    if (c._animationManager === undefined) {
      c._animationManager = new AnimationManager(container, 
        newProps.notifyStopBlinking, 
        newProps.notifyLoopTalking, 
        newProps.notifyDoneTalking);
    }

    // Apply props is only executed on state change, so we set a new clock.
    c._animationManager.restartAnimationClock();
    c._animationManager.setAnimationState(newProps.animationState);
    c._animationManager.startAnimation();
  }
});

export { Trump };
