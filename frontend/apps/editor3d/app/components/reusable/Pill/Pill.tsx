import { twMerge } from "tailwind-merge";
import { ReactNode } from "react";

export const Pill = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div
      className={twMerge(
        "w-fit rounded-md bg-brand-primary px-1.5 py-0.5 text-xs font-bold",
        className,
      )}
    >
      {children}
    </div>
  );
};
