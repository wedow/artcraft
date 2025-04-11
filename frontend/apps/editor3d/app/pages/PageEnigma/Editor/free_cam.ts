import { EventDispatcher, Quaternion, Vector3, Vector2 } from "three";
import * as THREE from "three";
import { cameras, selectedCameraId } from "~/pages/PageEnigma/signals/camera";

class FreeCam extends EventDispatcher {
  object: THREE.PerspectiveCamera;
  domElement: HTMLElement | Document;
  enabled = true;
  movementSpeed = 1.0;
  rollSpeed = 0.005;
  dragToLook = false;
  autoForward = false;
  dragging = false;
  xOffset = 0;
  yOffset = 0;

  lastMousePosition = new Vector2();
  mouseVelocity = new Vector2();
  tmpQuaternion = new Quaternion();

  status = 0;

  moveState = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
    forward: 0,
    back: 0,
    pitchUp: 0,
    pitchDown: 0,
    yawLeft: 0,
    yawRight: 0,
    rollLeft: 0,
    rollRight: 0,
  };
  moveVector = new Vector3(0, 0, 0);
  rotationVector = new Vector3(0, 0, 0);

  constructor(
    object: THREE.PerspectiveCamera,
    domElement: HTMLElement | Document,
  ) {
    super();

    this.object = object;
    this.domElement = domElement;

    this.keydown = this.keydown.bind(this);
    this.keyup = this.keyup.bind(this);
    this.reset = this.reset.bind(this);
    this.update = this.update.bind(this);
    this.updateMovementVector = this.updateMovementVector.bind(this);
    this.getContainerDimensions = this.getContainerDimensions.bind(this);
    this.dispose = this.dispose.bind(this);

    this.domElement.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });

    window.addEventListener("keydown", this.keydown.bind(this));
    window.addEventListener("keyup", this.keyup.bind(this));

    window.addEventListener("mousedown", this.mousedown.bind(this));
    window.addEventListener("mouseup", this.mouseup.bind(this));
    window.addEventListener("mousemove", this.mousemove.bind(this));
    window.addEventListener("wheel", this.mousewheel.bind(this));

    this.updateMovementVector();
  }

  keydown(event: KeyboardEvent) {
    if (event.altKey || !this.enabled) {
      return;
    }

    switch (event.code) {
      case "KeyW":
        this.moveState.forward = 1;
        break;
      case "KeyS":
        this.moveState.back = 1;
        break;

      case "KeyA":
        this.moveState.left = 1;
        break;
      case "KeyD":
        this.moveState.right = 1;
        break;

      case "KeyQ":
        this.moveState.down = 1;
        break;
      case "KeyE":
        this.moveState.up = 1;
        break;

      case "ArrowUp":
        this.moveState.pitchUp = 1;
        break;
      case "ArrowDown":
        this.moveState.pitchDown = 1;
        break;

      case "ArrowLeft":
        this.moveState.yawLeft = 1;
        break;
      case "ArrowRight":
        this.moveState.yawRight = 1;
        break;
    }

    this.updateMovementVector();
  }

  keyup(event: KeyboardEvent) {
    if (!this.enabled) {
      return;
    }

    switch (event.code) {
      case "KeyW":
        this.moveState.forward = 0;
        break;
      case "KeyS":
        this.moveState.back = 0;
        break;

      case "KeyA":
        this.moveState.left = 0;
        break;
      case "KeyD":
        this.moveState.right = 0;
        break;

      case "ArrowUp":
        this.moveState.pitchUp = 0;
        break;
      case "ArrowDown":
        this.moveState.pitchDown = 0;
        break;

      case "ArrowLeft":
        this.moveState.yawLeft = 0;
        break;
      case "ArrowRight":
        this.moveState.yawRight = 0;
        break;

      case "KeyQ":
        this.moveState.down = 0;
        break;
      case "KeyE":
        this.moveState.up = 0;
        break;
    }

    this.updateMovementVector();
  }

  mousedown(event: MouseEvent) {
    if (!this.enabled) {
      return;
    }
    if (event.button === 2) {
      this.dragging = true;
      this.xOffset = event.clientX;
      this.yOffset = event.clientY;
    }
  }

  mouseup(event: MouseEvent) {
    if (!this.enabled) {
      return;
    }
    if (event.button === 2) {
      this.xOffset = event.clientX;
      this.yOffset = event.clientY;
    }
    this.dragging = false;
  }

  mousemove(event: MouseEvent) {
    if (!this.enabled) {
      return;
    }
    if (this.dragging) {
      const mouseX = event.clientX - this.xOffset;
      const mouseY = event.clientY - this.yOffset;
      this.xOffset = event.clientX;
      this.yOffset = event.clientY;
      if (Math.abs(mouseX + mouseY) > 0) {
        this.object.translateX(-mouseX * (this.movementSpeed * 0.01));
        this.object.translateY(mouseY * (this.movementSpeed * 0.01));
      }
    }
  }

  mousewheel(event: WheelEvent) {
    if (!this.enabled) {
      return;
    }

    this.object.translateZ(event.deltaY / 120); // 120 is the lowest mouse wheel rot.
  }

  reset() {
    this.moveState.forward = 0;
    this.moveState.back = 0;
    this.moveState.left = 0;
    this.moveState.right = 0;
    this.moveState.pitchUp = 0;
    this.moveState.pitchDown = 0;
    this.moveState.yawLeft = 0;
    this.moveState.yawRight = 0;
    this.moveState.down = 0;
    this.moveState.up = 0;
    this.updateMovementVector();
  }

  update(delta: number) {
    if (!this.enabled) {
      return;
    }

    const moveMulti = delta * this.movementSpeed;

    this.object.translateX(this.moveVector.x * moveMulti);
    this.object.translateY(this.moveVector.y * moveMulti);
    this.object.translateZ(this.moveVector.z * moveMulti);

    // Update camera position in signals
    if (selectedCameraId.value) {
      const pos = this.object.position;
      const rot = this.object.rotation;

      // Calculate lookAt point based on camera's forward direction
      const lookAtPoint = new Vector3(0, 0, -1);
      lookAtPoint.applyQuaternion(this.object.quaternion);
      lookAtPoint.add(pos);

      cameras.value = cameras.value.map((cam) =>
        cam.id === selectedCameraId.value
          ? {
              ...cam,
              position: { x: pos.x, y: pos.y, z: pos.z },
              rotation: { x: rot.x, y: rot.y, z: rot.z },
              lookAt: { x: lookAtPoint.x, y: lookAtPoint.y, z: lookAtPoint.z },
            }
          : cam,
      );
    }
  }

  updateMovementVector() {
    const forward =
      this.moveState.forward || (this.autoForward && !this.moveState.back)
        ? 1
        : 0;

    this.moveVector.x = -this.moveState.left + this.moveState.right;
    this.moveVector.y = -this.moveState.down + this.moveState.up;
    this.moveVector.z = -forward + this.moveState.back;
  }

  getContainerDimensions() {
    if (this.domElement !== document) {
      return {
        size: [
          (this.domElement as HTMLElement).offsetWidth,
          (this.domElement as HTMLElement).offsetHeight,
        ],
        offset: [
          (this.domElement as HTMLElement).offsetLeft,
          (this.domElement as HTMLElement).offsetTop,
        ],
      };
    } else {
      return {
        size: [window.innerWidth, window.innerHeight],
        offset: [0, 0],
      };
    }
  }

  dispose() {
    // window.addEventListener('contextmenu', function(event) {
    //   event.preventDefault();
    // });

    // this.domElement.removeEventListener("contextmenu", this.contextmenu);
    // this.domElement.removeEventListener("pointerdown", this.pointerdown);
    // this.domElement.removeEventListener("pointermove", this.pointermove);
    // this.domElement.removeEventListener("pointerup", this.pointerup);
    // this.domElement.removeEventListener("pointercancel", this.pointercancel);
    //
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
  }
}

export { FreeCam };
