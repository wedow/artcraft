import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

interface LoaderInterface {
  file: File;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  statusCallback: (statusObject: { type: string; message?: string }) => void;
}

export const loadPreviewOnCanvas = ({
  file,
  canvas,
  statusCallback,
}: {
  file: File;
  canvas: HTMLCanvasElement;
  statusCallback: (error: { type: string; message?: string }) => void;
}) => {
  // Setup of scene, camera, and renderer in the canvas
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 2;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas,
    preserveDrawingBuffer: true,
  });

  renderer.setSize(
    canvas.getBoundingClientRect().width || 0,
    canvas.getBoundingClientRect().height || 0,
  );

  const color = 0xfcece7;
  const light = new THREE.HemisphereLight(color, 0x8d8d8d, 3.0);

  scene.add(light);

  // load the file into the preview mini-scene depending of the file's type
  if (file.name.includes(".glb")) {
    glbLoader({ file, scene, camera, renderer, statusCallback });
  } else if (file.name.includes(".pmd")) {
    pmdLoader({ file, scene, camera, renderer, statusCallback });
  } else if (
    file.name.includes(".png") ||
    file.name.includes(".jpg") ||
    file.name.includes(".jpeg") ||
    file.name.includes(".gif")
  ) {
    imagePlaneLoader({ file, scene, camera, renderer, statusCallback });
  } else if (file.name.includes(".vmd")) {
    statusCallback({
      type: "Preview Error",
      message: "Sorry, Preview is not available to VMD files yet",
    });
  } else {
    statusCallback({
      type: "Preview Error",
      message: "Unknown file type for loader",
    });
  }

  // Render the loaded data
  const animate = function () {
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(animate);
};

const glbLoader = ({
  file,
  camera,
  scene,
  renderer,
  statusCallback,
}: LoaderInterface) => {
  const loader = new GLTFLoader();
  loader.load(
    URL.createObjectURL(file),
    (data) => {
      data.scene.children.forEach((child) => {
        child.userData["color"] = "#FFFFFF";
        scene.add(child);

        let maxSize = 2;
        if (scene.children.length > 0) {
          scene.children.forEach((child) => {
            child.traverse((object: THREE.Object3D | THREE.Mesh) => {
              // Assuming `object` is your Three.js object and you know it's a Mesh
              if (object instanceof THREE.Mesh) {
                object.geometry.computeBoundingBox();
                const boundingBox = object.geometry.boundingBox;
                const center = new THREE.Vector3();
                boundingBox.getCenter(center);
                const dimensions = new THREE.Vector3();
                boundingBox.getSize(dimensions);
                const maxDim = Math.max(
                  dimensions.x,
                  dimensions.y,
                  dimensions.z,
                );
                if (maxSize < maxDim) {
                  maxSize = maxDim;
                  camera.position.set(-maxDim, maxDim, maxDim);
                  camera.lookAt(center);
                  camera.updateProjectionMatrix();
                }
              }
            });
          });
        }
        renderer.render(scene, camera);
        statusCallback({
          type: "OK",
          message: "Preview should be available",
        });
      });
    },
    undefined, // nothing to-do onProgress
    (loaderError) => {
      /*onError*/
      statusCallback({
        type: "GLB Loader Error",
        message: String(loaderError),
      });
    },
  );
};

const pmdLoader = ({
  camera,
  scene,
  renderer,
  statusCallback,
}: LoaderInterface) => {
  camera.position.z = 30;
  const loader = new FontLoader();
  loader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    (font) => {
      const textGeometry = new TextGeometry("MMD", {
        font: font,
        size: 100,
        depth: 5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 1,
        bevelOffset: 0,
        bevelSegments: 5,
      });
      textGeometry.computeBoundingBox();
      const textMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.scale.set(0.15, 0.15, 0.01);
      textMesh.position.set(-22, -5, 0);
      scene.add(textMesh);
      renderer.render(scene, camera);
      statusCallback({
        type: "OK",
        message: "Preview should be available",
      });
    },
    undefined, // nothing on Progress
    (loaderError) => {
      /*onError*/
      statusCallback({
        type: "PMD Loader Error",
        message: String(loaderError),
      });
    },
  );
};

const imagePlaneLoader = ({ file, scene, statusCallback }: LoaderInterface) => {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const loader = new THREE.TextureLoader();
  const texture = loader.load(
    URL.createObjectURL(file),
    undefined, // nothing to-do onLoad
    undefined, // nothing to-do onProgress
    (loaderError) => {
      /*onError*/
      statusCallback({
        type: "Image Plane Loader Error",
        message: String(loaderError),
      });
    },
  );
  texture.colorSpace = THREE.SRGBColorSpace;

  const image_material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: texture,
  });
  const obj = new THREE.Mesh(geometry, image_material);
  obj.receiveShadow = true;
  obj.castShadow = true;
  scene.add(obj);
  statusCallback({
    type: "OK",
    message: "Preview should be available",
  });
};
