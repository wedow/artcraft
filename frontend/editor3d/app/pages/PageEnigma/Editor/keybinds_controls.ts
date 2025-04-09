import * as THREE from "three";
import {
  hideObjectPanel,
  hotkeysStatus,
  outlinerState,
  showObjectPanel,
} from "../signals";
import {
  OrbitControls,
  OutlinePass,
  PointerLockControls,
} from "three/examples/jsm/Addons.js";
import { TransformControls } from "./TransformControls";
import { SceneManager, SceneObject } from "./scene_manager_api";
import { FreeCam } from "./free_cam";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { FKHelper } from "./KinHelpers/FKHelper";

export enum KinMode {
  FK,
  IK,
  NONE,
}

export class MouseControls {
  camera: THREE.PerspectiveCamera | null;
  camera_person_mode: boolean;
  lockControls: PointerLockControls | undefined;
  camera_last_pos: THREE.Vector3;
  selected: THREE.Object3D[] | undefined;
  orbitControls: OrbitControls | undefined;
  selectedCanvas: boolean;
  switchPreviewToggle: boolean;
  rendering: boolean;
  togglePlayback: Function;
  deleteObject: Function;
  canvReference: HTMLCanvasElement | null = null;
  mouse: THREE.Vector2 | undefined;
  timeline_mouse: THREE.Vector2 | undefined;
  control: TransformControls | undefined;
  raycaster: THREE.Raycaster | undefined;
  outlinePass: OutlinePass | undefined;
  scene: THREE.Scene;
  publishSelect: Function;
  updateSelectedUI: Function;
  transform_interaction: boolean;
  last_selected: THREE.Object3D[] | undefined;
  getAssetType: Function;
  setSelected: Function;
  sceneManager: SceneManager | undefined;
  private isProcessing: boolean = false;
  private cameraViewControls: FreeCam;
  private isMouseClicked: boolean = false;
  private isMovable: Function;
  enable_stats: Function;

  private kinMode: KinMode = KinMode.NONE;
  private fkHelper: FKHelper;
  private isBoneDragged: boolean = false;
  private ignoreNextClick: boolean = false;

  constructor(
    camera: THREE.PerspectiveCamera,
    camera_person_mode: boolean,
    cameraViewControls: FreeCam,
    lockControls: PointerLockControls | undefined,
    camera_last_pos: THREE.Vector3,
    selectedCanvas: boolean,
    switchPreviewToggle: boolean,
    rendering: boolean,
    togglePlayback: Function,
    deleteObject: Function,
    canvReference: HTMLCanvasElement | null,
    mouse: THREE.Vector2 | undefined,
    timeline_mouse: THREE.Vector2 | undefined,
    raycaster: THREE.Raycaster | undefined,
    control: TransformControls,
    outlinePass: OutlinePass | undefined,
    scene: THREE.Scene,
    publishSelect: Function,
    updateSelectedUI: Function,
    transform_interaction: boolean,
    last_selected: THREE.Object3D | undefined,
    getAssetType: Function,
    setSelected: Function,
    isMovable: Function,
    enable_stats: Function
  ) {
    this.camera = camera;
    this.camera_person_mode = camera_person_mode;
    this.cameraViewControls = cameraViewControls;
    this.lockControls = lockControls;
    this.camera_last_pos = camera_last_pos;
    this.selected = [];
    this.selectedCanvas = selectedCanvas;
    this.switchPreviewToggle = switchPreviewToggle;
    this.rendering = rendering;
    this.togglePlayback = togglePlayback;
    this.deleteObject = deleteObject;
    this.canvReference = canvReference;
    this.mouse = mouse;
    this.timeline_mouse = timeline_mouse;
    this.raycaster = raycaster;
    this.control = control;
    this.outlinePass = outlinePass;
    this.scene = scene;
    this.publishSelect = publishSelect;
    this.updateSelectedUI = updateSelectedUI;
    this.transform_interaction = transform_interaction;
    this.last_selected = [];
    this.getAssetType = getAssetType;
    this.setSelected = setSelected;
    this.sceneManager = undefined;
    this.isMovable = isMovable;
    this.enable_stats = enable_stats;
    this.fkHelper = new FKHelper({
      camera: this.camera,
      domElement: this.control.domElement,
      scene: this.scene,
      onDragChange: this.onFKControlsDragging.bind(this),
    });
  }

  onFKControlsDragging(dragging: boolean) {
    this.isBoneDragged = dragging;

    // FIX: Window dispatches a click event after FK dragging is complete
    // This flag can be used to ignore that when FK is adjusted
    this.ignoreNextClick = true;
  }

  clearFKVisuals() {
    this.fkHelper.clear();
  }

  focus() {
    if (this.lockControls && this.selected) {
      this.lockControls.camera.lookAt(this.selected[0].position);
      this.lockControls.camera.position.copy(this.selected[0].position);
      this.lockControls.moveForward(-5);
      this.lockControls.camera.position.add(new THREE.Vector3(0, 5, 0));
      this.lockControls.camera.lookAt(this.selected[0].position);
    }
  }

  removeTransformControls(remove_outline: boolean = true) {
    if (this.control == undefined) {
      return;
    }
    if (this.outlinePass == undefined) {
      return;
    }
    if (remove_outline) {
      this.last_selected = this.selected;
      this.selected = [];
      this.publishSelect();
    }
    this.hideTransformControls();
    if (remove_outline) this.outlinePass.selectedObjects = [];
  }

  hideTransformControls() {
    if (this.control == undefined) {
      return;
    }

    this.control.detach();
    this.scene.remove(this.control);
  }

  reattachTransformControls() {
    if (this.control == undefined || this.selected == undefined) {
      return;
    }

    this.control.attach(this.selected[0]);
    this.scene.add(this.control);
  }

  selectObject(currentObject: THREE.Object3D) {
    this.selected = [currentObject];
    this.setSelected(this.selected);
    this.publishSelect();

    // this.editor.update_properties()
    if (currentObject.userData["locked"] !== true && this.control) {
      this.scene.add(this.control);
      this.control.attach(currentObject);
    }

    if (this.selected && this.outlinePass) {
      this.outlinePass.selectedObjects = this.selected;
    }
    this.transform_interaction = true;
    // Contact react land
    showObjectPanel();
    this.updateSelectedUI();
  }

  onMouseDown(event: any) {
    if ((event.button === 0 || event.button === 1) && this.isMovable() && !this.isBoneDragged) {
      this.isMouseClicked = true;
    }
  }

  onMouseUp(event: any) {
    if (event.button === 0 || event.button === 1) {
      this.lockControls?.unlock();
      this.isMouseClicked = false;
    }

    if (event.button !== 0 && this.camera) {
      const camera_pos = new THREE.Vector3(
        parseFloat(this.camera.position.x.toFixed(2)),
        parseFloat(this.camera.position.y.toFixed(2)),
        parseFloat(this.camera.position.z.toFixed(2)),
      );
      this.camera_last_pos.copy(camera_pos);
    }
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  toggleFKMode() {
    if (this.kinMode == KinMode.FK) {
      this.fkHelper.clear();
      this.kinMode = KinMode.NONE;
      this.reattachTransformControls();
      console.log("FK mode off");
      return;
    }

    // Make sure we have an intersection
    if (!(this.selected && this.selected.length > 0)) {
      return;
    }

    // Make sure FK is supported only on character type objects
    const firstSelection = this.selected[0];
    if (!firstSelection.userData.isCharacter) {
      return;
    }

    // FK is good to go
    // Disable main transform controls
    this.hideTransformControls();
    this.kinMode = KinMode.FK;
    this.fkHelper.setTarget(this.selected[0]);
    console.log("FK mode on");
    return;
  }

  async onkeydown(event: KeyboardEvent) {
    if (hotkeysStatus.value.disabled) {
      return;
    } else if (event.key === "f" && this.selected && this.lockControls) {
      this.focus();
      return;
    } else if (event.key === " ") {
      if (!this.rendering && !this.switchPreviewToggle && this.selectedCanvas) {
        this.togglePlayback();
      }
      return;
    } else if (event.key === "Backspace" || event.key === "Delete") {
      if (this.selected) {
        this.selected.forEach((selected) => {
          this.deleteObject(selected.uuid);
        });
      }
      return;
    } else if (event.key === "t") {
      // transform
      this.control?.setMode("translate");
      return;
    } else if (event.key === "r" && !event.ctrlKey) {
      // rotate
      this.control?.setMode("rotate");
      return;
    } else if (event.key === "g") {
      // scale
      this.control?.setMode("scale");
      return;
    } else if (event.key === "k") {
      this.toggleFKMode();
    }

    if ((event.ctrlKey || event.metaKey) && !this.isProcessing) {
      if (event.key === "Z" || event.key === "z") {
        if (event.shiftKey) {
          // redo
          this.isProcessing = true;
          await this.sceneManager?.redo();
          this.isProcessing = false;
        } else {
          // undo
          this.isProcessing = true;
          await this.sceneManager?.undo();
          this.isProcessing = false;
        }
        return;
      } else if (event.key === "c") {
        // redo
        this.isProcessing = true;
        await this.sceneManager?.copy();
        this.isProcessing = false;
        return;
      } else if (event.key === "v") {
        // redo
        this.isProcessing = true;
        await this.sceneManager?.paste();
        this.isProcessing = false;
        return;
      } else if (event.key === "0") {
        // Stats Menu
        this.enable_stats();
      }
    }

    if (event.shiftKey) {
      this.cameraViewControls.movementSpeed = 4;
    } else {
      this.cameraViewControls.movementSpeed = 1.15;
    }
  }

  // Sets new mouse location usually used in raycasts.
  onMouseMove(event: MouseEvent) {
    if (this.canvReference == undefined) {
      return;
    }
    const rect = this.canvReference.getBoundingClientRect();
    if (this.mouse == undefined) {
      return;
    }
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.timeline_mouse = this.mouse;

    // this causes an issue  https://discourse.threejs.org/t/unable-to-use-pointer-lock-api/11092
    if (this.isMouseClicked && this.lockControls) {
      if (this.lockControls.isLocked == false) {
        this.lockControls.lock();
      }
    } else if (this.lockControls) {
      if (this.lockControls.isLocked == true) {
        this.lockControls.unlock();
      }
    }
  }

  // When the mouse clicks the screen.
  onMouseClick() {
    if (this.camera == undefined) {
      return;
    }

    // Ignore window clicks if FK is active and bone is being transformed
    if (this.ignoreNextClick) {
      this.ignoreNextClick = false;
      return;
    }

    const camera_pos = new THREE.Vector3(
      parseFloat(this.camera.position.x.toFixed(2)),
      parseFloat(this.camera.position.y.toFixed(2)),
      parseFloat(this.camera.position.z.toFixed(2)),
    );
    if (this.camera_last_pos.equals(new THREE.Vector3(0, 0, 0))) {
      this.camera_last_pos.copy(camera_pos);
    }

    if (
      this.raycaster == undefined ||
      this.mouse == undefined ||
      this.control == undefined ||
      this.outlinePass == undefined ||
      !this.camera_last_pos.equals(camera_pos)
    ) {
      this.camera_last_pos.copy(camera_pos);
      return;
    }
    this.camera_last_pos.copy(camera_pos);

    if (this.kinMode == KinMode.FK) {
      this.fkHelper.onMouseClick(this.mouse);
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const interactable: any[] = [];
    this.scene.children.forEach((child: THREE.Object3D) => {
      if (child.name != "") {
        if (
          child.type == "Mesh" ||
          child.type == "Object3D" ||
          child.type == "Group" ||
          child.type == "SkinnedMesh"
        ) {
          interactable.push(child);
        }
      }
    });
    const intersects = this.raycaster.intersectObjects(interactable, true);

    if (intersects.length > 0) {
      if (intersects[0].object.type != "GridHelper") {
        let currentObject = intersects[0].object;
        while (currentObject.parent && currentObject.parent.type !== "Scene") {
          currentObject = currentObject.parent;
        }

        this.selected = [];

        // Show panel here
        if (currentObject.type == "Scene") {
          this.selected?.push(intersects[0].object);
        } else {
          this.selected?.push(currentObject);
        }

        this.selectObject(currentObject);
      }
    } else {
      this.selected = [];
      this.setSelected(this.selected);
      this.removeTransformControls();
      //hideObjectPanel();
    }

    if (this.sceneManager) {
      const selected: SceneObject | null = this.sceneManager.selected();
      outlinerState.selectedItem.value = selected;
    }
  }
}
