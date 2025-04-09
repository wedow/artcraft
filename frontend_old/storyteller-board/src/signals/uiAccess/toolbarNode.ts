import { signal } from "@preact/signals-react";
import { ContextualUi } from "./type";
import { ToolbarNodeButtonNames as ButtonNames } from "~/components/features/ToolbarNode/enums";

type ButtonStates = {
  [key in ButtonNames]: {
    disabled: boolean;
    active: boolean;
    hidden: boolean;
  };
};
export interface ContextualToolbarProps extends ContextualUi {
  knodeIds: number[];
  disabled: boolean;
  downloadUrl?: string;
  locked: boolean | "unknown";
  lockDisabled: boolean;
  buttonStates: ButtonStates;
}
interface PartialContextualToolbarProps
  extends Partial<Omit<ContextualToolbarProps, "buttonStates">> {
  buttonStates?: Partial<ButtonStates>;
}
const toolbarNodeSignal = signal<ContextualToolbarProps>({
  knodeIds: [],
  position: {
    x: 0,
    y: 0,
  },
  isShowing: false,
  disabled: false,
  locked: false,
  lockDisabled: false,
  buttonStates: initButtonStates(),
});

export const toolbarNode = {
  signal: toolbarNodeSignal,
  isShowing() {
    return toolbarNodeSignal.value.isShowing;
  },
  setup(props: ContextualToolbarProps) {
    toolbarNodeSignal.value = props;
  },
  update(props: Partial<ContextualToolbarProps>) {
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      ...props,
    };
  },
  setPosition(position: ContextualToolbarProps["position"]) {
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      position,
    };
  },
  isLocked() {
    return toolbarNodeSignal.value.locked;
  },
  isLockDisabled() {
    return toolbarNodeSignal.value.lockDisabled;
  },
  disableLock() {
    toolbarNodeSignal.value.lockDisabled = true;
  },
  enableLock() {
    toolbarNodeSignal.value.lockDisabled = false;
  },
  setLocked(locked: boolean) {
    const { buttonStates } = toolbarNodeSignal.value;
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      buttonStates: {
        ...buttonStates,
        [ButtonNames.TRANSFORM]: {
          disabled: locked,
          hidden: false,
          active: buttonStates[ButtonNames.TRANSFORM].active,
        },
      },
      locked: locked,
    };
  },
  show(
    values: PartialContextualToolbarProps = {
      locked: false,
      buttonStates: {},
    },
  ) {
    const { locked, buttonStates, ...rest } = values;
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      ...rest,
      buttonStates: {
        ...initButtonStates({
          locked,
        }),
        ...buttonStates,
      },
      isShowing: true,
      locked: locked ?? false,
    };
  },
  hide() {
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      isShowing: false,
    };
  },
  enable() {
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      disabled: false,
    };
  },
  disable() {
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      disabled: true,
    };
  },
  changeButtonState(
    buttonName: ButtonNames,
    { disabled, active }: { disabled?: boolean; active?: boolean },
  ) {
    const prevButtonState = toolbarNodeSignal.value.buttonStates[buttonName];
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      buttonStates: {
        ...toolbarNodeSignal.value.buttonStates,
        [buttonName]: {
          disabled: disabled ?? prevButtonState.disabled,
          active: active ?? prevButtonState.active,
        },
      },
    };
  },
  batchButtonStates({ buttonStates }: { buttonStates: Partial<ButtonStates> }) {
    const prevButtonStates = toolbarNodeSignal.value.buttonStates;
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      buttonStates: {
        ...prevButtonStates,
        ...buttonStates,
      },
    };
  },
  resetAllButtonStates() {
    toolbarNodeSignal.value = {
      ...toolbarNodeSignal.value,
      buttonStates: initButtonStates(),
    };
  },
};

function initButtonStates(props: { locked?: boolean | "unknown" } = {}) {
  return Object.values(ButtonNames).reduce((buttonStates, buttonName) => {
    if (props.locked !== undefined && buttonName === ButtonNames.TRANSFORM) {
      buttonStates[buttonName] = {
        disabled: props.locked === "unknown" || props.locked === true,
        hidden: false,
        active: true,
      };
    } else {
      buttonStates[buttonName] = {
        disabled: false,
        hidden: false,
        active: false,
      };
    }
    return buttonStates;
  }, {} as ButtonStates);
}
