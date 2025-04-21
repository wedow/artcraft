import { NavLink, NavLinkProps } from "react-router-dom";
import { LabelHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface TypoProps {
  className?: string;
  children: ReactNode;
}
const baseTypo = "text-white";

export const H1 = ({ className, children }: TypoProps) => (
  <h1 className={twMerge(baseTypo, "text-2xl font-medium", className)}>
    {children}
  </h1>
);

export const H2 = ({ className, children }: TypoProps) => (
  <h2 className={twMerge(baseTypo, "text-xl font-medium", className)}>
    {children}
  </h2>
);

export const H3 = ({ className, children }: TypoProps) => (
  <h3 className={twMerge(baseTypo, "text-lg font-medium", className)}>
    {children}
  </h3>
);

export const H4 = ({ className, children }: TypoProps) => (
  <h4 className={twMerge(baseTypo, "text-base font-medium", className)}>
    {children}
  </h4>
);

export const Label = ({
  className,
  children,
  required,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) => (
  <label
    className={twMerge(baseTypo, "mb-2 text-[15px] font-medium", className)}
    {...rest}
  >
    {children}
    {required && <span className="ml-0.5 text-[#ff6467]">*</span>}
  </label>
);

export const H5 = ({ className, children }: TypoProps) => (
  <h5 className={twMerge(baseTypo, "text-sm font-medium", className)}>
    {children}
  </h5>
);

export const H6 = ({ className, children }: TypoProps) => (
  <h6 className={twMerge(baseTypo, "text-sm font-normal", className)}>
    {children}
  </h6>
);

export const Link = ({ className, ...rest }: NavLinkProps) => (
  <NavLink
    className={twMerge(
      "text-brand-primary transition-all duration-150 hover:text-brand-primary-400",
      className as string,
    )}
    {...rest}
  />
);

export const P = ({ className, children }: TypoProps) => (
  <p className={twMerge(baseTypo, className)}> {children} </p>
);
