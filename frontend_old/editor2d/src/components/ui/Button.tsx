import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconDefinition;
  iconClassName?: string;
  iconFlip?: boolean;
  htmlFor?: string;
  variant?: "primary" | "secondary" | "tertiary" | "action";
  loading?: boolean;
}

export const Button = ({
  icon,
  iconClassName,
  children,
  className: propsClassName,
  htmlFor,
  variant: propsVariant = "primary",
  disabled,
  iconFlip = false,
  loading,
  ...rest
}: ButtonProps) => {
  function getVariantClassNames(variant: string) {
    switch (variant) {
      case "tertiary": {
        return "bg-tertiary hover:bg-tertiary-400 text-white";
      }
      case "secondary": {
        return "bg-ui-controls hover:bg-ui-controls/80 text-white";
      }
      case "action": {
        return "bg-action hover:bg-action-500 text-white";
      }
      case "primary":
      default: {
        return "bg-primary hover:bg-primary-600 text-white";
      }
    }
  }

  const disabledClass = twMerge(
    disabled || loading ? "opacity-50 pointer-events-none" : "",
  );

  const className = twMerge(
    "text-[15px] font-semibold rounded-lg px-3 py-2 shadow-sm",
    "flex gap-2 items-center justify-center",
    "transition-all duration-150",
    getVariantClassNames(propsVariant),
    propsClassName,
    disabledClass,
  );

  // const ButtonType = htmlFor ? "label" : "button";
  if (htmlFor) {
    return (
      <label className={className} htmlFor={htmlFor} style={rest.style}>
        {loading && !iconFlip ? (
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        ) : (
          <>
            {icon && !iconFlip ? (
              <FontAwesomeIcon icon={icon} className={iconClassName} />
            ) : null}
          </>
        )}
        {children}
        {loading && iconFlip ? (
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        ) : (
          <>
            {icon && iconFlip ? (
              <FontAwesomeIcon icon={icon} className={iconClassName} />
            ) : null}
          </>
        )}
      </label>
    );
  }
  return (
    <button
      className={className}
      disabled={disabled || loading}
      {...{ ...rest, htmlFor }}
    >
      {loading && !iconFlip ? (
        <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
      ) : (
        <>
          {icon && !iconFlip ? (
            <FontAwesomeIcon icon={icon} className={iconClassName} />
          ) : null}
        </>
      )}
      {children}
      {loading && iconFlip ? (
        <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
      ) : (
        <>
          {icon && iconFlip ? (
            <FontAwesomeIcon icon={icon} className={iconClassName} />
          ) : null}
        </>
      )}
    </button>
  );
};
