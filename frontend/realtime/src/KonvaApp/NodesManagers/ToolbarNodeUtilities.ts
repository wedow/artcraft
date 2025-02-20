import Konva from "konva";
import { ToolbarNodeButtonNames } from "~/components/features/ToolbarNode";
import { ContextualToolbarProps } from "~/signals/uiAccess/toolbarNode";
export function calculateContextualsPosition(kNode: Konva.Transformer) {
  const w = kNode.getSize().width * kNode.scaleX();
  const h = kNode.getSize().height * kNode.scaleY();
  const x0 = kNode.getPosition().x;
  const y0 = kNode.getPosition().y;

  const d = kNode.getAbsoluteRotation();
  const r = d >= 0 ? (d * Math.PI) / 180 : ((360 + d) * Math.PI) / 180;

  let px: number, py: number;
  if (r < Math.PI / 2) {
    //top right quadrants
    px = x0 + (h * Math.sin(r) + w * Math.cos(r)) / 2 - h * Math.sin(r);
    py = y0 + h * Math.cos(r) + w * Math.cos(Math.PI / 2 - r);
  } else if (r < Math.PI) {
    //lower right quadrants
    px = x0 - (h * Math.sin(r) - w * Math.cos(r)) / 2;
    py = y0 + w * Math.cos(Math.PI / 2 - r);
  } else if (r < (Math.PI * 3) / 2) {
    //lower left quadrants
    px = x0 + h * Math.cos(r) - (h * Math.cos(r) + w * Math.sin(r)) / 2;
    py = y0;
  } else {
    //top left quadrants
    px = x0 + (-h * Math.sin(r) + w * Math.cos(r)) / 2;
    py = y0 + h * Math.cos(r);
  }
  return { x: px, y: py };
}
export function getImageNodeButtonStates(
  props: { locked?: boolean | "unknown" } = {},
) {
  const ButtonNames = ToolbarNodeButtonNames;
  return Object.values(ButtonNames).reduce(
    (buttonStates, buttonName) => {
      // transform button depends on locked state
      if (props.locked !== undefined && buttonName === ButtonNames.TRANSFORM) {
        buttonStates.TRANSFORM = {
          disabled: props.locked === "unknown" || props.locked === true,
          hidden: false,
          active: true,
        };
        return buttonStates;
      }

      // hidden buttons
      if (
        buttonName === ButtonNames.AI_STYLIZE ||
        buttonName === ButtonNames.SEGMENTATION ||
        buttonName === ButtonNames.DOWNLOAD ||
        buttonName === ButtonNames.CHROMA ||
        buttonName === ButtonNames.COLOR
      ) {
        buttonStates[buttonName] = {
          disabled: true,
          hidden: true,
          active: false,
        };
        return buttonStates;
      }

      // all other buttons
      buttonStates[buttonName] = {
        disabled: false,
        hidden: false,
        active: false,
      };
      return buttonStates;
    },
    {} as ContextualToolbarProps["buttonStates"],
  );
}
export function getTextNodeButtonStates(
  props: { locked?: boolean | "unknown" } = {},
) {
  const ButtonNames = ToolbarNodeButtonNames;
  return Object.values(ButtonNames).reduce(
    (buttonStates, buttonName) => {
      // transform button depends on locked state
      if (props.locked !== undefined && buttonName === ButtonNames.TRANSFORM) {
        buttonStates[buttonName] = {
          disabled: props.locked === "unknown" || props.locked === true,
          hidden: false,
          active: true,
        };
        return buttonStates;
      }

      // hidden buttons
      if (
        buttonName === ButtonNames.AI_STYLIZE ||
        buttonName === ButtonNames.SEGMENTATION ||
        buttonName === ButtonNames.DOWNLOAD ||
        buttonName === ButtonNames.CHROMA
      ) {
        buttonStates[buttonName] = {
          disabled: true,
          hidden: true,
          active: false,
        };
        return buttonStates;
      }

      // all other buttons
      buttonStates[buttonName] = {
        disabled: false,
        hidden: false,
        active: false,
      };
      return buttonStates;
    },
    {} as ContextualToolbarProps["buttonStates"],
  );
}
export function getVideoNodeButtonStates(
  props: { locked?: boolean | "unknown" } = {},
) {
  const ButtonNames = ToolbarNodeButtonNames;
  return Object.values(ButtonNames).reduce(
    (buttonStates, buttonName) => {
      // transform button depends on locked state
      if (props.locked !== undefined && buttonName === ButtonNames.TRANSFORM) {
        buttonStates.TRANSFORM = {
          disabled: props.locked === "unknown" || props.locked === true,
          hidden: false,
          active: true,
        };
        return buttonStates;
      }
      // soon to come feature is disabled
      if (buttonName === ButtonNames.AI_STYLIZE ||
        buttonName === ButtonNames.COLOR
      ) {
        buttonStates[buttonName] = {
          disabled: true,
          hidden: true,
          active: false,
        };
        return buttonStates;
      }
      // all other buttons
      buttonStates[buttonName] = {
        disabled: false,
        hidden: false,
        active: false,
      };
      return buttonStates;
    },
    {} as ContextualToolbarProps["buttonStates"],
  );
}
export function getMultiSelectButtonStates(
  props: { locked?: boolean | "unknown" } = {},
) {
  const ButtonNames = ToolbarNodeButtonNames;
  return Object.values(ButtonNames).reduce(
    (buttonStates, buttonName) => {
      // transform button depends on locked state
      if (props.locked !== undefined && buttonName === ButtonNames.TRANSFORM) {
        buttonStates[buttonName] = {
          disabled: props.locked === "unknown" || props.locked === true,
          hidden: false,
          active: true,
        };
        return buttonStates;
      }

      // hidden buttons
      if (
        buttonName === ButtonNames.AI_STYLIZE ||
        buttonName === ButtonNames.SEGMENTATION ||
        buttonName === ButtonNames.DOWNLOAD ||
        buttonName === ButtonNames.CHROMA ||
        buttonName === ButtonNames.COLOR
      ) {
        buttonStates[buttonName] = {
          disabled: true,
          hidden: true,
          active: false,
        };
        return buttonStates;
      }

      // all other buttons
      buttonStates[buttonName] = {
        disabled: false,
        hidden: false,
        active: false,
      };
      return buttonStates;
    },
    {} as ContextualToolbarProps["buttonStates"],
  );
}
