import { Toaster as SonnerToaster } from "sonner";

interface ToasterProps {
  topOffset?: number;
  rightOffset?: number;
}

export const Toaster = ({ topOffset = 0, rightOffset = 0 }: ToasterProps) => {
  return (
    <div className="relative z-[9]">
      <SonnerToaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        style={{ top: topOffset, right: rightOffset }}
      />
    </div>
  );
};

// Re-export toast function from sonner for easy access
export { toast } from "sonner";
