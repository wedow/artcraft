import { Label } from "~/components";

const ShortcutsGroup = (props: {
  label: string;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <Label className="text-md font-semibold" {...props}>
      {props.label}
    </Label>
    <div className="relative flex flex-col gap-2.5">
      {props.children}
      <div className="absolute top-0 h-full w-0.5 bg-white/15" />
    </div>
  </div>
);

const Shortcut = (props: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 ps-4">
    <span className="text-md w-[280px] font-medium opacity-80">
      {props.label}
    </span>
    {props.children}
  </div>
);

const Key = (props: { button: string }) => (
  <div className="flex h-[30px] w-auto min-w-[30px] items-center justify-center rounded-md border-b-2 border-[#9E9EA6] bg-white px-2 text-center text-sm font-bold text-ui-background">
    {props.button}
  </div>
);

const KeyGroup = (props: { children: React.ReactNode }) => (
  <div className="flex gap-1">{props.children}</div>
);

const Mouse = (props: {
  button: "left" | "middle" | "right";
  label: string;
}) => (
  <div className="flex items-center gap-2.5">
    <img
      alt={`${props.button} mouse`}
      src={`/resources/icons/mouse_${props.button === "left" ? "lmb" : props.button === "middle" ? "mmb" : "rmb"}.png`}
      className="h-7 w-auto object-contain"
    />
    <span className="text-sm font-normal opacity-60">{props.label}</span>
  </div>
);

const Plus = () => <div className="text-xl font-medium">+</div>;

export const Help = () => {
  return (
    <div className="mt-8 grid select-none grid-cols-2 gap-12 ps-4">
      <div className="flex flex-col gap-8">
        <ShortcutsGroup label="Navigation">
          {/* <Shortcut label="Forward">
            <Key button="w" label="Forward" />
          </Shortcut>
          <Shortcut label="Rotate View">
            <Mouse button="left" label="(Drag)" />
          </Shortcut>
          <Shortcut label="Zoom">
            <Mouse button="middle" label="(Scroll)" />
          </Shortcut> */}
          <Shortcut label="Orbit View">
            <KeyGroup>
              <Mouse button="middle" label="(Hold)" />
            </KeyGroup>
          </Shortcut>
          <Shortcut label="Forward Backward">
            <KeyGroup>
              <Key button="W" />
              <Key button="S" />
            </KeyGroup>
          </Shortcut>
          <Shortcut label="Left Right">
            <KeyGroup>
              <Key button="A" />
              <Key button="D" />
            </KeyGroup>
          </Shortcut>
          <Shortcut label="Up Down">
            <KeyGroup>
              <Key button="E" />
              <Key button="Q" />
            </KeyGroup>
          </Shortcut>
          <Shortcut label="Speed Boost">
            <KeyGroup>
              <Key button="Shift" />
            </KeyGroup>
          </Shortcut>
        </ShortcutsGroup>

        <ShortcutsGroup label="Shortcuts">
          <Shortcut label="Transform">
            <Key button="T" />
          </Shortcut>
          <Shortcut label="Rotate">
            <Key button="R" />
          </Shortcut>
          <Shortcut label="Scale">
            <Key button="G" />
          </Shortcut>
          <Shortcut label="Focus">
            <Key button="F" />
          </Shortcut>
          <Shortcut label="Copy">
            <Key button="Ctrl" />
            <Plus></Plus>
            <Key button="C" />
          </Shortcut>
          <Shortcut label="Paste">
            <Key button="Ctrl" />
            <Plus></Plus>
            <Key button="Shift" />
            <Plus></Plus>
            <Key button="V" />
          </Shortcut>
        </ShortcutsGroup>

        <ShortcutsGroup label="Interaction">
          <Shortcut label="Select Object">
            <Mouse button="left" label="(Click)" />
          </Shortcut>
          {/* <Shortcut label="Clear Selection">
            <Key button="Esc" />
          </Shortcut> */}
          {/* <Shortcut label="Focus Selection">
            <Key button="F" />
          </Shortcut> */}
          <Shortcut label="Delete Selection">
            <Key button="Del" />
          </Shortcut>
        </ShortcutsGroup>
      </div>

      <div className="flex flex-col gap-8">
        <ShortcutsGroup label="Timeline">
          <Shortcut label="Select Clip">
            <Mouse button="left" label="(Click)" />
          </Shortcut>
          <Shortcut label="Move Clip">
            <Mouse button="left" label="(Drag)" />
          </Shortcut>
          <Shortcut label="Delete Selection">
            <Key button="Del" />
          </Shortcut>
          <Shortcut label="Scroll">
            <Mouse button="middle" label="(Scroll)" />
          </Shortcut>
          <Shortcut label="Side Scroll">
            <Key button="Shift" />
            <Plus />
            <Mouse button="middle" label="(Scroll)" />
          </Shortcut>
          {/* <Shortcut label="Zoom">
            <Key button="Ctrl/Cmd" />
            <Plus />
            <Mouse button="middle" label="(Scroll)" />
          </Shortcut> */}
          <Shortcut label="Add Keyframe to Selected Object">
            <Key button="K" />
          </Shortcut>
          <Shortcut label="Select Keyframe">
            <Mouse button="left" label="(Click)" />
          </Shortcut>
          <Shortcut label="Delete Selected Keyframe">
            <Key button="Del" />
          </Shortcut>
        </ShortcutsGroup>

        <ShortcutsGroup label="Side Panel">
          <Shortcut label="Add Character">
            <Mouse button="left" label="(Drag onto scene)" />
          </Shortcut>
          <Shortcut label="Add Animation">
            <Mouse button="left" label="(Drag onto timeline)" />
          </Shortcut>
          <Shortcut label="Add Object">
            <Mouse button="left" label="(Drag onto scene)" />
          </Shortcut>
        </ShortcutsGroup>
      </div>
    </div>
  );
};
