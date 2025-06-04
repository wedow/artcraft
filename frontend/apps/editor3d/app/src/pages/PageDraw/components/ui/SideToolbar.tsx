import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMousePointer,
  faShapes,
  faEraser,
  faTrash,
  faEyeDropper,
  faImage,
  faSquare,
  faCircle,
  faPlay,
  faSparkles,
  faFileImport,
  faFileExport,
} from "@fortawesome/pro-solid-svg-icons";
import "../../App.css";
import { HsvaColorPicker, HsvaColor } from "react-colorful";
import { hsvaToHex } from "@uiw/color-convert";
import SliderWithIndicator from "./SliderWithIndicator";
import { useSceneStore } from "../../stores/SceneState";
import { Tooltip } from "@storyteller/ui-tooltip";

/* visual constants */
const shapeIconBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10";

/* small debounce */
function useDebounced<T extends (...args: A) => void, A extends unknown[]>(
  fn: T,
  ms = 75,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: A) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  };
}

export interface SideToolbarProps {
  onSelect: () => void;
  onAddShape: (shape: "rectangle" | "circle" | "triangle") => void;
  onPaintBrush: (hex: string, size: number) => void;
  onEraser: (size: number) => void;
  onCanvasBackground: (hex: string) => void;
  onGenerateImage: () => void;
  onUploadImage: () => void;
  onDelete: () => void;
  activeToolId: string;
  className?: string;
}

const SideToolbar: React.FC<SideToolbarProps> = ({
  onSelect,
  onAddShape,
  onPaintBrush,
  onEraser,
  onCanvasBackground,
  onGenerateImage,
  onUploadImage,
  onDelete,
  activeToolId,
  className = "",
}) => {
  /* ------------------------------------------------ state ---------- */
  const [open, setOpen] = useState<string | null>(null);

  const [brushSize, setBrushSize] = useState(16);
  const [brushHsva, setBrushHsva] = useState<HsvaColor>({
    h: 120,
    s: 100,
    v: 100,
    a: 1,
  });
  const [bgHsva, setBgHsva] = useState<HsvaColor>({
    h: 0,
    s: 100,
    v: 100,
    a: 1,
  });

  /* debounced parent calls */
  const sendPaint = useDebounced<
    (hex: string, size: number) => void,
    [string, number]
  >(onPaintBrush, 75);
  const sendBg = useDebounced<(hex: string) => void, [string]>(
    onCanvasBackground,
    75,
  );

  /* picker helper */
  const makePicker = (
    hsva: HsvaColor,
    setHsva: React.Dispatch<React.SetStateAction<HsvaColor>>,
    sendHex: (hex: string) => void,
    extra?: React.ReactNode,
  ) => (
    <div className={`glass relative w-fit rounded-2xl p-4 shadow-lg`}>
      <button className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600 absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full">
        <FontAwesomeIcon icon={faEyeDropper} size="sm" />
      </button>

      <HsvaColorPicker
        color={hsva}
        onChange={(c) => {
          setHsva(c);
          sendHex(hsvaToHex(c));
        }}
        className="brush-picker"
      />

      {extra}
    </div>
  );

  const BrushPopout = makePicker(
    brushHsva,
    setBrushHsva,
    (hex) => sendPaint(hex, brushSize),
    <>
      <div className="relative">
        <p className="mb-2 text-sm font-medium text-white">Brush Size</p>
        <SliderWithIndicator
          value={brushSize}
          onChange={(size) => {
            setBrushSize(size);
            sendPaint(hsvaToHex(brushHsva), size);
          }}
          min={1}
          max={64}
        />
      </div>
    </>,
  );

  const BgPopout = makePicker(bgHsva, setBgHsva, sendBg);

  /* ------------------------------------------------ tools ---------- */

  const store = useSceneStore(); // Use store directly
  const tools = [
    {
      id: "select",
      label: "Select & Move",
      icon: (
        <FontAwesomeIcon icon={faMousePointer} className="pl-0.5 text-lg" />
      ),
      onClick: () => {
        onSelect();
      },
    },
    { id: "separator-1", type: "separator" },
    {
      id: "add-shape",
      label: "Add Shape",
      icon: <FontAwesomeIcon icon={faShapes} className="h-5 w-5" />,
      popout: (
        <div
          className={`flex items-center gap-1.5 rounded-full px-1.5 py-1.5 shadow-lg`}
        >
          {[
            faSquare,
            faCircle,
            faPlay, // triangle
          ].map((faIcon, i) => (
            <button
              key={i}
              className={shapeIconBtn}
              onClick={() => {
                const shapes = ["rectangle", "circle", "triangle"] as const;
                onAddShape(shapes[i]);
                setOpen(null);
              }}
            >
              <FontAwesomeIcon icon={faIcon} className="h-5 w-5 text-white" />
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "generate",
      label: "Generate Image",
      icon: <FontAwesomeIcon icon={faSparkles} className="h-5 w-5" />,
      onClick: () => {
        onGenerateImage();
      },
    },
    {
      id: "upload",
      label: "Upload Image",
      icon: <FontAwesomeIcon icon={faImage} className="h-5 w-5" />,
      onClick: () => {
        onUploadImage();
      },
    },
    { id: "separator-2", type: "separator" },
    {
      id: "paint",
      label: "Brush",
      icon: (
        <span
          className="inline-block h-5 w-5 rounded-full border-2 border-white"
          style={{ backgroundColor: hsvaToHex(brushHsva) }}
        />
      ),
      onClick: () => {
        sendPaint(hsvaToHex(brushHsva), brushSize);
      },
      popout: BrushPopout,
    },
    {
      id: "eraser",
      label: "Eraser",
      icon: <FontAwesomeIcon icon={faEraser} className="h-5 w-5" />,
      onClick: () => {
        onEraser(brushSize);
      },
      popout: (
        <div className="p-4">
          <SliderWithIndicator
            value={brushSize}
            onChange={(size) => {
              setBrushSize(size);
              onEraser(size);
            }}
            label="Eraser Size"
          />
        </div>
      ),
    },
    {
      id: "delete",
      label: "Delete",
      icon: <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />,
      onClick: () => {
        onDelete();
      },
    },
    { id: "separator-3", type: "separator" },
    {
      id: "background",
      label: "Canvas Background",
      icon: (
        <span
          className="inline-block h-5 w-5 rounded-full border-2 border-white"
          style={{ backgroundColor: hsvaToHex(bgHsva) }}
        />
      ),
      popout: BgPopout,
    },
    {
      id: "save-scene",
      label: "Save Scene",
      icon: <FontAwesomeIcon icon={faFileExport} className="h-5 w-5" />,
      onClick: () => {
        store.saveSceneToFile();
      },
    },
    {
      id: "load-scene",
      label: "Load Scene",
      icon: <FontAwesomeIcon icon={faFileImport} className="h-5 w-5" />,
      onClick: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files[0]) {
            const success = await store.loadSceneFromFile(target.files[0]);
            if (success) {
              console.log("Scene loaded successfully");
            } else {
              console.error("Failed to load scene");
            }
          }
        };
        input.click();
      },
    },
  ];

  /* ------------------------------------------------ render ---------- */
  const baseBtn =
    "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors border-2 border-transparent";

  return (
    <aside
      className={`glass ml-4 flex flex-col items-center gap-3 rounded-xl p-1.5 shadow-lg ${className}`}
    >
      {tools.map((tool) => {
        if (tool.type === "separator") {
          return <div key={tool.id} className="my-1 h-px w-8 bg-white/15" />;
        }

        const { id, icon, onClick, popout, label } = tool;
        const active = id === activeToolId;
        const btnStyle = active
          ? "bg-primary/30 border-2 !border-primary text-white"
          : "hover:bg-white/10 text-white";

        return (
          <div key={id} className="relative">
            <Tooltip
              content={label}
              position="right"
              closeOnClick={true}
              className="ms-1 rounded-md px-3 py-1"
              delay={100}
            >
              {popout ? (
                <button
                  onClick={() => {
                    onClick?.();
                    setOpen(open === id ? null : id);
                  }}
                  className={`${baseBtn} ${btnStyle}`}
                >
                  {icon}
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClick?.();
                  }}
                  className={`${baseBtn} ${btnStyle}`}
                >
                  {icon}
                </button>
              )}
            </Tooltip>

            {open === id && popout && (
              <div
                onMouseLeave={() => {
                  setOpen(null);
                }}
                className="absolute left-14 top-1/2 -translate-y-1/2 rounded-xl border border-[#404040] bg-[#303030] transition-all duration-200 ease-in-out"
              >
                {popout}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};

export default SideToolbar;
