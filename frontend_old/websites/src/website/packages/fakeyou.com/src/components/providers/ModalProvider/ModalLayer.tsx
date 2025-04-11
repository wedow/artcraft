import React from "react";
import { a, easings, useTransition } from "@react-spring/web";
import { ModalWidth } from "hooks";
import "./ModalLayer.scss";

interface ModalLayerProps {
  content?: React.ElementType | null;
  contentProps?: any;
  close: () => void;
  debug?: string;
  killModal: boolean;
  lockTint?: boolean;
  modalOpen: boolean;
  onModalCloseEnd: (x: any) => void;
  padding?: boolean;
  scroll?: boolean;
  width?: ModalWidth;
}

export default function ModalLayer({
  content: Content,
  contentProps,
  close,
  debug,
  lockTint,
  modalOpen,
  onModalCloseEnd,
  padding = true,
  scroll,
  width = "wide",
}: ModalLayerProps) {
  const mainClassName = "fy-modal-layer";
  const tintTransition = useTransition(modalOpen, {
    config: {
      easing: modalOpen ? easings.easeOutQuad : easings.easeInQuad,
      duration: 100,
    },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    onRest: onModalCloseEnd,
  });

  if (debug) { console.log(`🐛 ModalLayer debug at ${debug}`, modalOpen); }

  return tintTransition(
    (tintStyle, modalIsOpen) =>
      modalIsOpen && (
        <a.div
          {...{
            className: mainClassName,
            style: tintStyle,
            onMouseDown: ({ target }) => {
              if (
                !lockTint &&
                target instanceof HTMLElement &&
                target.className === mainClassName
              ) {
                close();
              }
            },
          }}
        >
          <div
            {...{
              className: `fy-modal-body-${width}${padding ? "" : " fy-modal-no-padding"
                }${scroll ? " fy-modal-scrollable" : ""
                }`,
            }}
          >
            {Content && (
              <Content {...{ ...contentProps, handleClose: close }} />
            )}
          </div>
        </a.div>
      )
  );
}
