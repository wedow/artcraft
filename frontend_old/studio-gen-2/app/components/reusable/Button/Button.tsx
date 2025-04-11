import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { ButtonHTMLAttributes } from "react";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconDefinition;
  iconClassName?: string;
  iconFlip?: boolean;
  htmlFor?: string;
  variant?: "primary" | "secondary" | "action";
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
      case "secondary": {
        return "bg-brand-secondary hover:bg-brand-secondary-900 text-white focus-visible:outline-brand-secondary";
      }
      case "action": {
        return "bg-action hover:bg-action-900 text-white focus-visible:outline-action";
      }
      case "primary":
      default: {
        return "bg-brand-primary hover:bg-brand-primary-400 text-white focus-visible:outline-brand-primary-600";
      }
    }
  }

  const disabledClass = twMerge(
    disabled || loading ? "opacity-50 pointer-events-none" : "",
  );

  const className = twMerge(
    "text-sm font-medium rounded-lg px-3 py-2 border border-[#363636] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-150 flex gap-2 items-center justify-center",
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
