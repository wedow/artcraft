import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImages,
  faPlus,
  faDownload,
  faUpload,
  faCrosshairs,
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { downloadFileFromUrl } from "@storyteller/api";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { UploadEntryCard } from "../../components/media/UploadEntryCard";
import {
  useAnglesStore,
  GeneratedAngle,
  ROTATION_VALUES,
  TILT_VALUES,
  ZOOM_VALUES,
} from "./AnglesStore";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { twMerge } from "tailwind-merge";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import { Switch } from "@headlessui/react";

// ─── Utility ──────────────────────────────────────────────────────────────────

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("Failed to convert file to base64."));
      }
    };
    reader.onerror = () => reject(new Error("Error reading file."));
    reader.readAsDataURL(file);
  });
};

/** Snap a raw value to the nearest allowed value in an array */
const snapToNearest = (value: number, allowedValues: number[]): number => {
  let closest = allowedValues[0];
  let minDist = Math.abs(value - closest);
  for (const v of allowedValues) {
    const dist = Math.abs(value - v);
    if (dist < minDist) {
      minDist = dist;
      closest = v;
    }
  }
  return closest;
};

// ─── 3D Orbit Sphere Canvas ──────────────────────────────────────────────────

interface OrbitSphereProps {
  rotation: number;
  tilt: number;
  zoom: number;
  onDragEnd: (rotation: number, tilt: number) => void;
}

const OrbitSphere = memo(
  ({ rotation, tilt, zoom, onDragEnd }: OrbitSphereProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    // Live (unsnapped) values used during drag for smooth rendering
    const liveRotation = useRef(rotation);
    const liveTilt = useRef(tilt);
    const rafId = useRef<number | null>(null);

    // Sync live values when props change (i.e., from slider or snap)
    useEffect(() => {
      if (!isDragging.current) {
        liveRotation.current = rotation;
        liveTilt.current = tilt;
      }
    }, [rotation, tilt]);

    const drawSphere = useCallback(
      (renderRotation: number, renderTilt: number, dragging = false) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const displayW = canvas.clientWidth;
        const displayH = canvas.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = displayW;
        const h = displayH;
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.36;

        ctx.clearRect(0, 0, w, h);

        // Subtle outer glow (neutral, matches dark UI)
        const outerGlow = ctx.createRadialGradient(
          cx,
          cy,
          radius * 0.8,
          cx,
          cy,
          radius * 1.3,
        );
        outerGlow.addColorStop(0, "rgba(255, 255, 255, 0.02)");
        outerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = outerGlow;
        ctx.fillRect(0, 0, w, h);

        const rotRad = (renderRotation * Math.PI) / 180;
        const tiltRad = (renderTilt * Math.PI) / 180;

        const project = (
          x3d: number,
          y3d: number,
          z3d: number,
        ): { x: number; y: number; depth: number } => {
          const perspective = 3.5;
          const scale = perspective / (perspective - z3d);
          return {
            x: cx + x3d * radius * scale,
            y: cy + y3d * radius * scale,
            depth: z3d,
          };
        };

        // Draw wireframe sphere — brighter when actively dragging
        const wireAlpha = dragging ? 0.12 : 0.06;
        ctx.strokeStyle = `rgba(255, 255, 255, ${wireAlpha})`;
        ctx.lineWidth = 0.7;

        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI) / 6 + rotRad;
          ctx.beginPath();
          for (let j = 0; j <= 40; j++) {
            const phi = (j / 40) * Math.PI * 2;
            const x3d = Math.cos(angle) * Math.sin(phi);
            const y3d = Math.cos(phi);
            const z3d = Math.sin(angle) * Math.sin(phi);
            const p = project(x3d, y3d, z3d);
            if (j === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        for (let i = 1; i < 6; i++) {
          const phi = (i * Math.PI) / 6;
          ctx.beginPath();
          for (let j = 0; j <= 40; j++) {
            const angle = (j / 40) * Math.PI * 2 + rotRad;
            const x3d = Math.cos(angle) * Math.sin(phi);
            const y3d = Math.cos(phi);
            const z3d = Math.sin(angle) * Math.sin(phi);
            const p = project(x3d, y3d, z3d);
            if (j === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        // ─── 3D Camera object ──────────────────────────────────────────
        const camPosX = Math.sin(rotRad) * Math.cos(tiltRad);
        const camPosY = -Math.sin(tiltRad);
        const camPosZ = Math.cos(rotRad) * Math.cos(tiltRad);

        const camScreen = project(camPosX, camPosY, camPosZ);
        const centerScreen = project(0, 0, 0);

        // Solid line from camera to center
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(camScreen.x, camScreen.y);
        ctx.lineTo(centerScreen.x, centerScreen.y);
        ctx.stroke();

        const dirX = -camPosX;
        const dirY = -camPosY;
        const dirZ = -camPosZ;

        let rightX = dirZ;
        const rightY = 0;
        let rightZ = -dirX;
        const rightLen = Math.sqrt(rightX * rightX + rightZ * rightZ) || 1;
        rightX /= rightLen;
        rightZ /= rightLen;

        let upX = rightY * dirZ - rightZ * dirY;
        let upY = rightZ * dirX - rightX * dirZ;
        let upZ = rightX * dirY - rightY * dirX;
        const upLen = Math.sqrt(upX * upX + upY * upY + upZ * upZ) || 1;
        upX /= upLen;
        upY /= upLen;
        upZ /= upLen;

        // Camera body — wider than tall for realistic proportions
        const bodyW = 0.19;
        const bodyH = 0.13;
        const bodyD = 0.16;

        // Helper to build 8-corner box from center + half-dims
        const makeBox = (
          bx: number,
          by: number,
          bz: number,
          hw: number,
          hh: number,
          hd: number,
        ) => [
          // Back face 0-3
          {
            x: bx + rightX * hw + upX * hh,
            y: by + rightY * hw + upY * hh,
            z: bz + rightZ * hw + upZ * hh,
          },
          {
            x: bx - rightX * hw + upX * hh,
            y: by - rightY * hw + upY * hh,
            z: bz - rightZ * hw + upZ * hh,
          },
          {
            x: bx - rightX * hw - upX * hh,
            y: by - rightY * hw - upY * hh,
            z: bz - rightZ * hw - upZ * hh,
          },
          {
            x: bx + rightX * hw - upX * hh,
            y: by + rightY * hw - upY * hh,
            z: bz + rightZ * hw - upZ * hh,
          },
          // Front face 4-7
          {
            x: bx + dirX * hd + rightX * hw + upX * hh,
            y: by + dirY * hd + rightY * hw + upY * hh,
            z: bz + dirZ * hd + rightZ * hw + upZ * hh,
          },
          {
            x: bx + dirX * hd - rightX * hw + upX * hh,
            y: by + dirY * hd - rightY * hw + upY * hh,
            z: bz + dirZ * hd - rightZ * hw + upZ * hh,
          },
          {
            x: bx + dirX * hd - rightX * hw - upX * hh,
            y: by + dirY * hd - rightY * hw - upY * hh,
            z: bz + dirZ * hd - rightZ * hw - upZ * hh,
          },
          {
            x: bx + dirX * hd + rightX * hw - upX * hh,
            y: by + dirY * hd + rightY * hw - upY * hh,
            z: bz + dirZ * hd + rightZ * hw - upZ * hh,
          },
        ];

        // Main body
        const bodyCorners3D = makeBox(
          camPosX,
          camPosY,
          camPosZ,
          bodyW,
          bodyH,
          bodyD,
        );

        // Lens barrel — protrudes from front face center
        const lensLen = 0.1;
        const lensR = 0.07;
        const lensCx = camPosX + dirX * bodyD;
        const lensCy = camPosY + dirY * bodyD;
        const lensCz = camPosZ + dirZ * bodyD;
        const lensCorners3D = makeBox(
          lensCx,
          lensCy,
          lensCz,
          lensR,
          lensR,
          lensLen,
        );

        // Viewfinder — small bump on top, toward back
        const vfOffD = -0.02;
        const vfCx = camPosX + dirX * vfOffD + upX * (bodyH + 0.04);
        const vfCy = camPosY + dirY * vfOffD + upY * (bodyH + 0.04);
        const vfCz = camPosZ + dirZ * vfOffD + upZ * (bodyH + 0.04);
        const vfCorners3D = makeBox(vfCx, vfCy, vfCz, 0.06, 0.04, 0.07);

        // Project all corners
        const bodyCorners = bodyCorners3D.map((c) => project(c.x, c.y, c.z));
        const lensCorners = lensCorners3D.map((c) => project(c.x, c.y, c.z));
        const vfCorners = vfCorners3D.map((c) => project(c.x, c.y, c.z));

        // Face definitions for each part
        const faceIndices: [number, number, number, number][] = [
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [0, 1, 5, 4],
          [3, 2, 6, 7],
          [1, 2, 6, 5],
          [0, 3, 7, 4],
        ];
        const bodyColors = [
          "rgba(80, 80, 90, 0.9)",
          "rgba(50, 50, 60, 0.9)",
          "rgba(70, 70, 80, 0.9)",
          "rgba(55, 55, 65, 0.9)",
          "rgba(60, 60, 70, 0.9)",
          "rgba(65, 65, 75, 0.9)",
        ];
        const lensColors = [
          "rgba(45, 45, 55, 0.95)",
          "rgba(30, 30, 40, 0.95)",
          "rgba(40, 40, 50, 0.95)",
          "rgba(35, 35, 45, 0.95)",
          "rgba(38, 38, 48, 0.95)",
          "rgba(42, 42, 52, 0.95)",
        ];
        const vfColors = [
          "rgba(75, 75, 85, 0.9)",
          "rgba(55, 55, 65, 0.9)",
          "rgba(65, 65, 75, 0.9)",
          "rgba(60, 60, 70, 0.9)",
          "rgba(58, 58, 68, 0.9)",
          "rgba(68, 68, 78, 0.9)",
        ];

        // Collect all faces with their projected corners for painter's sort
        const allFaces: {
          pts: { x: number; y: number; depth: number }[];
          color: string;
          isFront: boolean;
          avgDepth: number;
        }[] = [];

        const addFaces = (
          corners: { x: number; y: number; depth: number }[],
          colors: string[],
          markFront: boolean,
        ) => {
          for (let i = 0; i < 6; i++) {
            const pts = faceIndices[i].map((idx) => corners[idx]);
            const avgDepth =
              pts.reduce((sum, p) => sum + p.depth, 0) / pts.length;
            allFaces.push({
              pts,
              color: colors[i],
              isFront: markFront && i === 1,
              avgDepth,
            });
          }
        };
        addFaces(bodyCorners, bodyColors, false);
        addFaces(lensCorners, lensColors, true);
        addFaces(vfCorners, vfColors, false);

        // Sort all faces back-to-front
        allFaces.sort((a, b) => a.avgDepth - b.avgDepth);

        // Lens tip position for red dot
        const lensTip = {
          x: lensCx + dirX * (lensLen + 0.01),
          y: lensCy + dirY * (lensLen + 0.01),
          z: lensCz + dirZ * (lensLen + 0.01),
        };
        const lensTipScreen = project(lensTip.x, lensTip.y, lensTip.z);

        // Draw all faces
        for (const face of allFaces) {
          ctx.beginPath();
          ctx.moveTo(face.pts[0].x, face.pts[0].y);
          for (let i = 1; i < face.pts.length; i++) {
            ctx.lineTo(face.pts[i].x, face.pts[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = face.color;
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Draw red lens dot after lens front face
          if (face.isFront) {
            const lensGlow = ctx.createRadialGradient(
              lensTipScreen.x,
              lensTipScreen.y,
              0,
              lensTipScreen.x,
              lensTipScreen.y,
              10,
            );
            lensGlow.addColorStop(0, "rgba(255, 60, 60, 0.9)");
            lensGlow.addColorStop(0.5, "rgba(255, 60, 60, 0.3)");
            lensGlow.addColorStop(1, "rgba(255, 60, 60, 0)");
            ctx.fillStyle = lensGlow;
            ctx.beginPath();
            ctx.arc(lensTipScreen.x, lensTipScreen.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Lens glass circle
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(lensTipScreen.x, lensTipScreen.y, 5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "rgba(80, 140, 220, 0.6)";
            ctx.beginPath();
            ctx.arc(lensTipScreen.x, lensTipScreen.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Center crosshair
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 0.8;
        const crossSize = 5;
        ctx.beginPath();
        ctx.moveTo(centerScreen.x - crossSize, centerScreen.y);
        ctx.lineTo(centerScreen.x + crossSize, centerScreen.y);
        ctx.moveTo(centerScreen.x, centerScreen.y - crossSize);
        ctx.lineTo(centerScreen.x, centerScreen.y + crossSize);
        ctx.stroke();
      },
      [],
    );

    // Redraw when props change (not during drag — drag triggers its own redraws)
    useEffect(() => {
      if (!isDragging.current) {
        drawSphere(rotation, tilt);
      }
    }, [rotation, tilt, drawSphere]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };

        // Update live values smoothly
        liveRotation.current += dx * 0.8;
        liveTilt.current = Math.max(
          -30,
          Math.min(60, liveTilt.current - dy * 0.8),
        );

        // Request a redraw with live values
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          drawSphere(liveRotation.current, liveTilt.current, true);
          rafId.current = null;
        });
      },
      [drawSphere],
    );

    const handleMouseUp = useCallback(() => {
      if (!isDragging.current) return;
      isDragging.current = false;

      // Snap to nearest allowed values on release
      let rawRot = liveRotation.current % 360;
      if (rawRot < 0) rawRot += 360;
      const snappedRotation = snapToNearest(rawRot, ROTATION_VALUES);
      const snappedTilt = snapToNearest(liveTilt.current, TILT_VALUES);

      // Update live refs to snapped values
      liveRotation.current = snappedRotation;
      liveTilt.current = snappedTilt;

      // Redraw at snapped position
      drawSphere(snappedRotation, snappedTilt);

      // Notify parent
      onDragEnd(snappedRotation, snappedTilt);
    }, [drawSphere, onDragEnd]);

    return (
      <canvas
        ref={canvasRef}
        className="h-[200px] w-full cursor-grab active:cursor-grabbing"
        style={{ width: "100%", height: "200px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    );
  },
);

// ─── Main Angles Component ─────────────────────────────────────────────────────

export const Angles = () => {
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // State selectors (only re-render when specific values change)
  const sourceImageUrl = useAnglesStore((s) => s.sourceImageUrl);
  const imageDimensions = useAnglesStore((s) => s.imageDimensions);
  const angleConfig = useAnglesStore((s) => s.angleConfig);
  const generateFromBestAngles = useAnglesStore(
    (s) => s.generateFromBestAngles,
  );
  const generatedAngles = useAnglesStore((s) => s.generatedAngles);
  const activeAngleId = useAnglesStore((s) => s.activeAngleId);
  const isProcessing = useAnglesStore((s) => s.isProcessing);
  const isLoadingImage = useAnglesStore((s) => s.isLoadingImage);

  // Actions (stable references — never cause re-renders)
  const setSourceImage = useAnglesStore((s) => s.setSourceImage);
  const setImageDimensions = useAnglesStore((s) => s.setImageDimensions);
  const setRotation = useAnglesStore((s) => s.setRotation);
  const setTilt = useAnglesStore((s) => s.setTilt);
  const setZoom = useAnglesStore((s) => s.setZoom);
  const setGenerateFromBestAngles = useAnglesStore(
    (s) => s.setGenerateFromBestAngles,
  );
  const addGeneratedAngle = useAnglesStore((s) => s.addGeneratedAngle);
  const setActiveAngle = useAnglesStore((s) => s.setActiveAngle);
  const setIsProcessing = useAnglesStore((s) => s.setIsProcessing);
  const setIsLoadingImage = useAnglesStore((s) => s.setIsLoadingImage);
  const resetSource = useAnglesStore((s) => s.resetSource);

  const activeAngle = useMemo(
    () => generatedAngles.find((a) => a.id === activeAngleId) ?? null,
    [generatedAngles, activeAngleId],
  );

  // Window resize handler (debounced to avoid excessive re-renders)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Popover "add" items
  const addMenuItems: PopoverItem[] = useMemo(
    () => [
      {
        label: "Upload Image",
        selected: false,
        icon: <FontAwesomeIcon icon={faUpload} className="h-4 w-4" />,
        action: "upload",
      },
      {
        label: "Choose from Library",
        selected: false,
        icon: <FontAwesomeIcon icon={faImages} className="h-4 w-4" />,
        action: "library",
      },
    ],
    [],
  );

  const handleAddMenuSelect = useCallback((item: PopoverItem) => {
    if (item.action === "upload") {
      fileInputRef.current?.click();
    } else if (item.action === "library") {
      setIsGalleryModalOpen(true);
    }
  }, []);

  const handleLocalImageSelect = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file || !file.type.startsWith("image/")) return;

      setIsLoadingImage(true);

      try {
        const base64Image = await convertFileToBase64(file);
        const objectUrl = URL.createObjectURL(file);

        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            setImageDimensions({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
            resolve();
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = objectUrl;
        });

        setSourceImage(objectUrl, base64Image);
        setIsLoadingImage(false);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
        setIsLoadingImage(false);
      }
    },
    [setSourceImage, setImageDimensions, setIsLoadingImage],
  );

  const handleImageSelect = useCallback((id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [id];
    });
  }, []);

  const handleGallerySelect = useCallback(
    async (selectedItems: GalleryItem[]) => {
      const item = selectedItems[0];
      if (!item || !item.fullImage) {
        toast.error("No image selected");
        return;
      }

      const imageUrl = item.fullImage;
      setIsGalleryModalOpen(false);
      setSelectedGalleryImages([]);
      setIsLoadingImage(true);

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "library-image.png", {
          type: blob.type,
        });
        const base64Image = await convertFileToBase64(file);

        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            setImageDimensions({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
            resolve();
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = imageUrl;
        });

        setSourceImage(imageUrl, base64Image);
        setIsLoadingImage(false);
      } catch (error) {
        console.error("Error processing gallery image:", error);
        toast.error("Failed to process image");
        setIsLoadingImage(false);
      }
    },
    [setSourceImage, setImageDimensions, setIsLoadingImage],
  );

  const handleGenerate = useCallback(async () => {
    if (!sourceImageUrl || isProcessing) return;

    setIsProcessing(true);
    toast("Generating angle...", { icon: "🎯" });

    // Simulate generation (replace with actual Tauri API when available)
    setTimeout(() => {
      const newAngle: GeneratedAngle = {
        id: uuidv4(),
        imageUrl: sourceImageUrl, // Placeholder: would be the generated result
        rotation: angleConfig.rotation,
        tilt: angleConfig.tilt,
        zoom: angleConfig.zoom,
        timestamp: Date.now(),
      };

      addGeneratedAngle(newAngle);
      setIsProcessing(false);
      toast.success("Angle generated! Saved to Library");
    }, 2500);
  }, [
    sourceImageUrl,
    isProcessing,
    angleConfig,
    addGeneratedAngle,
    setIsProcessing,
  ]);

  const handleDownload = useCallback(async () => {
    if (!activeAngle) {
      toast.error("No image to download");
      return;
    }
    try {
      await downloadFileFromUrl(activeAngle.imageUrl);
      toast.success("Image saved to Downloads folder");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  }, [activeAngle]);

  const handleThumbnailClick = useCallback(
    (angle: GeneratedAngle) => {
      setActiveAngle(angle.id);
    },
    [setActiveAngle],
  );

  // Called when user releases the sphere drag — values are already snapped
  const handleSphereDragEnd = useCallback(
    (snappedRotation: number, snappedTilt: number) => {
      setRotation(snappedRotation);
      setTilt(snappedTilt);
    },
    [setRotation, setTilt],
  );

  const showUploadScreen = !sourceImageUrl && !isLoadingImage;

  const imageContainerStyle = useMemo(() => {
    if (!imageDimensions) {
      return { width: "600px", height: "450px" };
    }

    const horizontalPadding = 128 + 32 + 300;
    const verticalPadding = 128 + 150;

    const availableWidth = windowSize.width - horizontalPadding;
    const availableHeight = windowSize.height - 56 - verticalPadding;

    const maxWidth = Math.min(availableWidth, 1200);
    const maxHeight = Math.max(availableHeight, 200);
    const imageAspect = imageDimensions.width / imageDimensions.height;

    let width = maxWidth;
    let height = width / imageAspect;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * imageAspect;
    }

    width = Math.max(width, 200);
    height = Math.max(height, 150);

    return { width: `${width}px`, height: `${height}px` };
  }, [imageDimensions, windowSize.width, windowSize.height]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleLocalImageSelect(e.target.files);
        e.target.value = "";
      }
    },
    [handleLocalImageSelect],
  );

  const handleOpenGallery = useCallback(() => {
    setIsGalleryModalOpen(true);
  }, []);

  const handleCloseGallery = useCallback(() => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  }, []);

  const handleChangeImage = useCallback(() => {
    resetSource();
  }, [resetSource]);

  // Slider handlers that snap to allowed values
  const handleRotationSlider = useCallback(
    (value: number) => {
      setRotation(snapToNearest(value, ROTATION_VALUES));
    },
    [setRotation],
  );

  const handleTiltSlider = useCallback(
    (value: number) => {
      setTilt(snapToNearest(value, TILT_VALUES));
    },
    [setTilt],
  );

  const handleZoomSlider = useCallback(
    (value: number) => {
      setZoom(snapToNearest(value, ZOOM_VALUES));
    },
    [setZoom],
  );

  // Arrow step handlers for orbit sphere
  const handleRotationStep = useCallback(
    (direction: 1 | -1) => {
      const idx = ROTATION_VALUES.indexOf(angleConfig.rotation);
      const next =
        (idx + direction + ROTATION_VALUES.length) % ROTATION_VALUES.length;
      setRotation(ROTATION_VALUES[next]);
    },
    [angleConfig.rotation, setRotation],
  );

  const handleTiltStep = useCallback(
    (direction: 1 | -1) => {
      const idx = TILT_VALUES.indexOf(angleConfig.tilt);
      const next = Math.max(
        0,
        Math.min(TILT_VALUES.length - 1, idx + direction),
      );
      setTilt(TILT_VALUES[next]);
    },
    [angleConfig.tilt, setTilt],
  );

  return (
    <>
      <div className="bg-ui-panel-gradient flex h-[calc(100vh-56px)] w-full overflow-hidden bg-ui-panel text-base-fg">
        {/* Main content area */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-16">
          <main className="flex h-full w-full flex-col items-center justify-center">
            {showUploadScreen ? (
              <div className="w-full max-w-5xl">
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-background shadow-lg">
                  <UploadEntryCard
                    icon={faCrosshairs}
                    title="Angles"
                    description="Generate new camera angles from a single photo. Upload an image to get started."
                    accentBackgroundClass="bg-lime-500/20"
                    accentBorderClass="border-lime-500/40"
                    accept="image/*"
                    onFilesSelected={handleLocalImageSelect}
                    primaryLabel="Upload media"
                    secondaryLabel="Pick from Library"
                    secondaryIcon={faImages}
                    onSecondaryClick={handleOpenGallery}
                    disabled={isLoadingImage}
                  />
                  {isLoadingImage && (
                    <div className="bg-ui-panel/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                      <LoadingSpinner className="h-12 w-12" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full max-w-[1200px] flex-col items-center">
                {/* Top toolbar */}
                <div className="flex shrink-0 gap-3 pb-4">
                  <Button
                    variant="action"
                    onClick={handleChangeImage}
                    className="border-ui-controls-border select-none border-2 px-6 py-2.5 text-sm font-semibold transition-all"
                  >
                    Change Image
                  </Button>
                  {activeAngle && (
                    <Button
                      variant="primary"
                      icon={faDownload}
                      onClick={handleDownload}
                      disabled={isProcessing}
                      className={twMerge(
                        "select-none border-2 border-primary px-6 py-2.5 text-sm font-semibold transition-all",
                        isProcessing && "cursor-not-allowed opacity-50",
                      )}
                    >
                      Download
                    </Button>
                  )}
                </div>

                {/* Image display area */}
                <div className="flex flex-1 items-center justify-center">
                  <div
                    className="relative overflow-hidden rounded-2xl border border-ui-panel-border shadow-xl"
                    style={imageContainerStyle}
                  >
                    {/* Source/Active image */}
                    {activeAngle ? (
                      <img
                        src={activeAngle.imageUrl}
                        alt="Generated Angle"
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    ) : sourceImageUrl ? (
                      <>
                        <img
                          src={sourceImageUrl}
                          alt="Source"
                          className="absolute inset-0 h-full w-full object-contain"
                        />
                        {isProcessing && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="relative z-10 flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
                                <FontAwesomeIcon
                                  icon={faCrosshairs}
                                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-primary-400"
                                />
                              </div>
                              <span className="text-lg font-semibold text-white">
                                Generating Angle...
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-ui-background">
                        <LoadingSpinner className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom thumbnail strip */}
                <div className="mt-auto flex shrink-0 items-center gap-3 rounded-xl border border-ui-panel-border bg-ui-background p-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileInputChange}
                  />

                  <PopoverMenu
                    items={addMenuItems}
                    onSelect={handleAddMenuSelect}
                    mode="button"
                    position="top"
                    showIconsInList
                    buttonClassName={twMerge(
                      "h-14 w-14 border-2 border-dashed border-ui-panel-border bg-ui-controls/50",
                      isProcessing && "cursor-not-allowed opacity-50",
                    )}
                    triggerIcon={
                      <FontAwesomeIcon icon={faPlus} className="text-xl" />
                    }
                  />

                  {generatedAngles.map((angle) => (
                    <button
                      key={angle.id}
                      onClick={() => handleThumbnailClick(angle)}
                      className={twMerge(
                        "relative h-14 w-14 overflow-hidden rounded-lg border-2 transition-all",
                        angle.id === activeAngleId
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-primary/50",
                      )}
                    >
                      <img
                        src={angle.imageUrl}
                        alt={`Angle ${angle.rotation}°`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-0.5 py-px text-center text-[8px] text-base-fg/80">
                        {angle.rotation}°
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ──── Right side panel — Angle Controls ──── */}
        {sourceImageUrl && (
          <div className="flex w-[280px] shrink-0 flex-col border-l border-ui-panel-border">
            {/* Panel header */}
            <div className="flex items-center gap-2.5 border-b border-ui-panel-border px-4 py-3">
              <FontAwesomeIcon
                icon={faCrosshairs}
                className="text-sm text-lime-400"
              />
              <span className="text-sm font-semibold text-base-fg/90">
                Angle Controls
              </span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Orbit sphere with arrow controls */}
              <div className="border-b border-ui-panel-border px-4 py-3">
                <p className="mb-2 text-center text-xs text-base-fg/50">
                  Drag to change camera angle
                </p>
                <div className="relative">
                  {/* Top arrow — tilt up */}
                  <button
                    onClick={() => handleTiltStep(1)}
                    className="absolute left-1/2 top-0 z-10 -translate-x-1/2 p-1.5 text-base-fg/40 transition-colors hover:text-base-fg/80"
                  >
                    <FontAwesomeIcon icon={faChevronUp} className="text-xs" />
                  </button>
                  {/* Bottom arrow — tilt down */}
                  <button
                    onClick={() => handleTiltStep(-1)}
                    className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 p-1.5 text-base-fg/40 transition-colors hover:text-base-fg/80"
                  >
                    <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                  </button>
                  {/* Left arrow — rotation step left */}
                  <button
                    onClick={() => handleRotationStep(-1)}
                    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 p-1.5 text-base-fg/40 transition-colors hover:text-base-fg/80"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                  </button>
                  {/* Right arrow — rotation step right */}
                  <button
                    onClick={() => handleRotationStep(1)}
                    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 p-1.5 text-base-fg/40 transition-colors hover:text-base-fg/80"
                  >
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-xs"
                    />
                  </button>
                  <OrbitSphere
                    rotation={angleConfig.rotation}
                    tilt={angleConfig.tilt}
                    zoom={angleConfig.zoom}
                    onDragEnd={handleSphereDragEnd}
                  />
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4 border-b border-ui-panel-border px-4 py-4">
                {/* Rotation */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-base-fg/70">
                      Rotation
                    </span>
                    <span className="text-xs font-semibold text-base-fg/90">
                      {angleConfig.rotation}°
                    </span>
                  </div>
                  <SliderV2
                    min={0}
                    max={315}
                    step={45}
                    value={angleConfig.rotation}
                    onChange={handleRotationSlider}
                    suffix="°"
                  />
                </div>

                {/* Tilt */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-base-fg/70">
                      Tilt
                    </span>
                    <span className="text-xs font-semibold text-base-fg/90">
                      {angleConfig.tilt}°
                    </span>
                  </div>
                  <SliderV2
                    min={-30}
                    max={60}
                    step={30}
                    value={angleConfig.tilt}
                    onChange={handleTiltSlider}
                    suffix="°"
                  />
                </div>

                {/* Zoom */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-base-fg/70">
                      Zoom
                    </span>
                    <span className="text-xs font-semibold text-base-fg/90">
                      {angleConfig.zoom}
                    </span>
                  </div>
                  <SliderV2
                    min={0}
                    max={10}
                    step={5}
                    value={angleConfig.zoom}
                    onChange={handleZoomSlider}
                  />
                </div>
              </div>

              {/* Generate from best angles toggle */}
              <div className="border-b border-ui-panel-border px-4 py-4">
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="cursor-pointer text-xs text-base-fg/70">
                      Generate from 12 best angles
                    </Switch.Label>
                    <Switch
                      checked={generateFromBestAngles}
                      onChange={setGenerateFromBestAngles}
                      className={twMerge(
                        "group inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        generateFromBestAngles ? "bg-primary" : "bg-action",
                      )}
                    >
                      <span
                        className={twMerge(
                          "size-4 rounded-full bg-white transition",
                          generateFromBestAngles
                            ? "translate-x-6"
                            : "translate-x-1",
                        )}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
              </div>
            </div>

            {/* Generate button — fixed at bottom */}
            <div className="p-4">
              <Button
                variant="primary"
                icon={faCrosshairs}
                onClick={handleGenerate}
                disabled={isProcessing || !sourceImageUrl}
                loading={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={handleCloseGallery}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={1}
        onUseSelected={handleGallerySelect}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );
};
