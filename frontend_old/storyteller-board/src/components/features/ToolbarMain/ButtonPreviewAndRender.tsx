import { faCameraMovie, faPlayCircle } from "@fortawesome/pro-solid-svg-icons";
import { Button, Tooltip } from "~/components/ui";
import { ToolbarButtonProps } from "../ToolbarButton";

export const ButtonPreviewAndRender = ({
  buttonPreviewProps,
  buttonRenderProps,
}: {
  buttonPreviewProps: ToolbarButtonProps;
  buttonRenderProps: ToolbarButtonProps;
}) => {
  return (
    <div className="flex">
      <ButtonPreview {...buttonPreviewProps} />
      <ButtonRender {...buttonRenderProps} />
    </div>
  );
};
const ButtonPreview = (buttonProps: ToolbarButtonProps) => {
  const {
    className: customButtonClassNames,
    disabled,
    active,
    hidden,
    onClick,
    ...restButtonProps
  } = buttonProps;
  return (
    <Tooltip tip="Preview">
      <Button
        className="text-nowrap rounded-r-none border-r border-white"
        icon={faPlayCircle}
        disabled={disabled}
        {...restButtonProps}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onClick) {
            onClick(e);
          }
        }}
        {...restButtonProps}
      />
    </Tooltip>
  );
};
const ButtonRender = (buttonProps: ToolbarButtonProps) => {
  const {
    className: customButtonClassNames,
    disabled,
    active,
    hidden,
    onClick,
    ...restButtonProps
  } = buttonProps;
  return (
    <Tooltip tip="Click to Finish Movie">
      <Button
        className="text-nowrap rounded-l-none"
        icon={faCameraMovie}
        disabled={disabled}
        {...restButtonProps}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onClick) {
            onClick(e);
          }
        }}
        {...restButtonProps}
      >
        Render Movie
      </Button>
    </Tooltip>
  );
};
