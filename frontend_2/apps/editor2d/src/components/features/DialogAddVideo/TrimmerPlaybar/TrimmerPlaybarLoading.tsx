import { twMerge } from "tailwind-merge";

export const TrimmingPlaybarLoading = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div className={twMerge("relative h-10 w-full bg-gray-200", className)}>
      <div className="mt-3 h-4 w-full animate-pulse bg-secondary-500" />
    </div>
  );
};
