import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMousePointer,
  faShapes,
  faTrash,
  faEyeDropper,
  faImage,
  faSquare,
  faCircle,
  faUndo,
  faRedo,
  faPaintBrush,
  faTriangle,
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
  onActivateShapeTool: (shape: "rectangle" | "circle" | "triangle") => void;
  currentShape: "rectangle" | "circle" | "triangle" | null;
  onPaintBrush: (hex: string, size: number, opacity: number) => void;
  onCanvasBackground: (hex: string) => void;
  onUploadImage: () => void;
  onDelete: () => void;
  activeToolId: string;
  className?: string;
}

const SideToolbar: React.FC<SideToolbarProps> = ({
  onSelect,
  onActivateShapeTool,
  currentShape,
  onPaintBrush,
  onCanvasBackground,
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
    s: 0,
    v: 100,
    a: 1,
  });

  /* debounced parent calls */
  const sendPaint = useDebounced<
    (hex: string, size: number, opacity: number) => void,
    [string, number, number]
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
    (hex) => sendPaint(hex, brushSize, brushHsva.a),

    <>
      <div className="relative">
        <p className="mb-2 text-sm font-medium text-white">Brush Size</p>
        <SliderWithIndicator
          value={brushSize}
          onChange={(size) => {
            setBrushSize(size);
            sendPaint(hsvaToHex(brushHsva), size, brushHsva.a);
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
      onClick: () => {
        // Activate shape tool using currently selected shape if any and clear selection
        store.selectNode(null);
        if (!store.currentShape) {
          store.setCurrentShape("rectangle");
        }
        store.setActiveTool("shape");
      },
      popout: (
        <div className="flex items-center gap-1.5 rounded-full px-1.5 py-1.5 shadow-lg">
          {[faSquare, faCircle, faTriangle].map((faIcon, i) => (
            <button
              key={i}
              className={shapeIconBtn}
              onClick={() => {
                const shapes = ["rectangle", "circle", "triangle"] as const;
                onActivateShapeTool(shapes[i]);
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
      id: "upload",
      label: "Upload Image",
      icon: <FontAwesomeIcon icon={faImage} className="h-5 w-5" />,
      onClick: () => {
        onUploadImage();
      },
    },
    { id: "separator-2", type: "separator" },
    {
      id: "draw",
      label: "Brush",
      icon: null,
      onClick: () => {
        sendPaint(hsvaToHex(brushHsva), brushSize, brushHsva.a);
        store.setActiveTool("draw");
      },
      popout: BrushPopout,
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
      id: "undo",
      label: "Undo",
      icon: <FontAwesomeIcon icon={faUndo} className="h-5 w-5" />,
      onClick: () => {
        store.undo(); // Assuming store has an undo method
      },
    },
    {
      id: "redo",
      label: "Redo",
      icon: <FontAwesomeIcon icon={faRedo} className="h-5 w-5" />,
      onClick: () => {
        store.redo(); // Assuming store has a redo method
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
        const active =
          id === activeToolId ||
          (id === "add-shape" && activeToolId === "shape");
        const btnStyle = active
          ? "bg-primary/30 border-2 !border-primary text-white"
          : "hover:bg-white/10 text-white";

        // Dynamic icon for brush/draw tool
        let displayIcon = icon;
        if (id === "draw") {
          displayIcon = active ? (
            <span
              className="inline-block h-5 w-5 rounded-full border-2 border-white"
              style={{ backgroundColor: hsvaToHex(brushHsva) }}
            />
          ) : (
            <FontAwesomeIcon icon={faPaintBrush} className="h-5 w-5" />
          );
        }

        // Dynamic icon for shape tool
        if (id === "add-shape" && activeToolId === "shape" && currentShape) {
          const shapeIcons = {
            rectangle: faSquare,
            circle: faCircle,
            triangle: faTriangle,
          } as const;
          displayIcon = (
            <FontAwesomeIcon
              icon={shapeIcons[currentShape]}
              className="h-5 w-5"
            />
          );
        }

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
                  {displayIcon}
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClick?.();
                  }}
                  className={`${baseBtn} ${btnStyle}`}
                >
                  {displayIcon}
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
