import React, { useState, useRef } from "react";
import {
  MousePointer2,
  Shapes,
  Eraser,
  Trash2,
  UploadCloud,
  Pipette,
  Image,
  Square,
  Circle,
  Triangle,
  Star,
  StarsIcon,
} from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import "@/App.css";
import { HsvaColorPicker, HsvaColor } from "react-colorful";
import { hsvaToHex } from "@uiw/color-convert";
import SliderWithIndicator from './SliderWithIndicator';
import { useSceneStore } from "./SceneState";

/* visual constants */
const panelBg = "bg-zinc-800";
const panelBorder = "border border-zinc-700";
const shapeIconBtn =
  "flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-zinc-700 focus-visible:bg-zinc-700";

/* small debounce */
function useDebounced<T extends (...a: any[]) => void>(fn: T, ms = 75) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  };
}

export interface SideToolbarProps {
  onSelect: () => void;
  onAddShape: (shape: 'rectangle' | 'circle' | 'triangle') => void;
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
  const [open, setOpen]       = useState<string | null>(null);

  const [brushSize, setBrushSize] = useState(16);
  const [brushHsva, setBrushHsva] = useState<HsvaColor>({ h:120,s:100,v:100,a:1 });
  const [bgHsva,    setBgHsva]    = useState<HsvaColor>({ h:0,  s:100,v:100,a:1 });
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const sliderRef = useRef<HTMLInputElement>(null);

  /* debounced parent calls */
  const sendPaint = useDebounced(onPaintBrush, 75);
  const sendBg    = useDebounced(onCanvasBackground, 75);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = Number(e.target.value);
    setBrushSize(size);
    sendPaint(hsvaToHex(brushHsva), size);
    
    // Calculate position for the tooltip
    const slider = sliderRef.current;
    if (slider) {
      const rect = slider.getBoundingClientRect();
      const percentage = (size - 1) / (64 - 1); // Normalize to 0-1
      const position = rect.width * percentage;
      setSliderPosition(position);
    }
  };

  /* picker helper */
  const makePicker = (
    hsva: HsvaColor,
    setHsva: React.Dispatch<React.SetStateAction<HsvaColor>>,
    sendHex: (hex: string) => void,
    extra?: React.ReactNode
  ) => (
    <div className={`relative w-fit rounded-2xl bg-zinc-900 p-4 shadow-lg ${panelBg} ${panelBorder}`}>
      <button className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 hover:bg-zinc-600">
        <Pipette size={16} />
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
        <p className="mb-2 text-sm font-medium text-zinc-100">Brush Size</p>
        <div className="relative">
          <input
            ref={sliderRef}
            type="range"
            min={1}
            max={64}
            value={brushSize}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            className="w-48 accent-zinc-700"
          />
          {isDragging && (
            <div 
              className="
                absolute top-6
                transform -translate-x-1/2
                bg-zinc-700 text-white
                text-sm font-medium
                transition-all duration-150
                rounded-full px-3 py-1.5
                after:content-[''] after:absolute after:left-1/2 after:-top-1.5 after:-translate-x-1/2
                after:border-[6px] after:border-transparent after:border-b-zinc-700
              "
              style={{ left: `${sliderPosition}px` }}
            >
              {brushSize}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const BgPopout = makePicker(bgHsva, setBgHsva, sendBg);

  /* ------------------------------------------------ tools ---------- */

  const store = useSceneStore(); // Use store directly
  const tools = [
    { 
      id: "select", 
      label: "Select & Move", 
      icon: <MousePointer2 className="h-5 w-5"/>, 
      onClick: () => {
        onSelect();
      }
    },
    { id: "separator-1", type: "separator" },
    {
      id: "add-shape",
      label: "Add Shape",
      icon: <Shapes className="h-5 w-5" />,
      popout: (
        <div className={`flex items-center gap-4 rounded-full px-4 py-2 shadow-lg ${panelBg} ${panelBorder}`}>
          {[Square, Circle, Triangle].map((Icon, i) => (
            <button 
              key={i} 
              className={shapeIconBtn} 
              onClick={() => {
                const shapes = ['rectangle', 'circle', 'triangle'] as const;
                onAddShape(shapes[i]);
                setOpen(null);
              }}
            >
              <Icon className="h-5 w-5 text-white"/>
            </button>
          ))}
        </div>
      ),
    },
    { 
      id: "generate", 
      label: "Generate Image", 
      icon: <StarsIcon className="h-5 w-5"/>, 
      onClick: () => {
        onGenerateImage();
      }
    },
    { 
      id: "upload", 
      label: "Upload Image", 
      icon: <Image className="h-5 w-5"/>, 
      onClick: () => {
        onUploadImage();
      }
    },
    { id: "separator-2", type: "separator" },
    {
      id: "paint",
      label: "Brush",
      icon: <span className="inline-block h-5 w-5 rounded-full border-2 border-white" style={{backgroundColor: hsvaToHex(brushHsva)}}/>,
      onClick: () => {
        sendPaint(hsvaToHex(brushHsva), brushSize);
      },
      popout: BrushPopout,
    },
    {
      id: "eraser",
      label: "Eraser",
      icon: <Eraser className="h-5 w-5"/>,
      onClick: () => {
        onEraser(brushSize);
      },
      popout: (
        <div className="w-64 rounded-lg bg-zinc-800 p-4 shadow-lg">
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
      icon: <Trash2 className="h-5 w-5"/>, 
      onClick: () => {
        onDelete();
      }
    },
    { id: "separator-3", type: "separator" },
    {
      id: "background",
      label: "Canvas Background",
      icon: <span className="inline-block h-5 w-5 rounded-full border-2 border-white" style={{backgroundColor: hsvaToHex(bgHsva)}}/>,
      popout: BgPopout,
    },
    {
      id: "save-scene",
      label: "Save Scene",
      icon: <UploadCloud className="h-5 w-5"/>,
      onClick: () => {
        store.saveSceneToFile();
      }
    },
    {
      id: "load-scene",
      label: "Load Scene",
      icon: <UploadCloud className="h-5 w-5"/>,
      onClick: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files[0]) {
            const success = await store.loadSceneFromFile(target.files[0]);
            if (success) {
              console.log('Scene loaded successfully');
            } else {
              console.error('Failed to load scene');
            }
          }
        };
        input.click();
      }
    },
  ];

  /* ------------------------------------------------ render ---------- */
  const baseBtn =
    "relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors ring-1 ring-transparent " +
    "hover:ring-zinc-400 focus-visible:ring-zinc-400 active:ring-zinc-400";

  return (
    <TooltipProvider delayDuration={100}>
      <aside className={`ml-4 flex w-16 flex-col items-center gap-3 rounded-2xl ${panelBg} ${panelBorder} py-4 shadow-lg ${className}`}>
        {tools.map((tool) => {
          if (tool.type === "separator") {
            return (
              <div 
                key={tool.id} 
                className="w-8 h-px bg-zinc-600 my-1"
              />
            );
          }

          const { id, icon, onClick, popout, label } = tool;
          const active = id === activeToolId;
          const btnStyle = active ? "bg-zinc-600 text-white" : "hover:bg-zinc-800 text-zinc-100";

          return (
            <div key={id} className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>

                <TooltipContent side="right" sideOffset={8} className={`${panelBg} ${panelBorder} rounded-md px-3 py-1 text-zinc-100`}>
                  {label}
                </TooltipContent>
              </Tooltip>

              {open===id && popout && (
                <div
                  onMouseLeave={() => {
                    setOpen(null);
                  }}
                  className="absolute left-20 top-1/2 -translate-y-1/2 transition-all duration-200 ease-in-out"
                >
                  {popout}
                </div>
              )}
            </div>
          );
        })}
      </aside>
    </TooltipProvider>
  );
};

export default SideToolbar;
