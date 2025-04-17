import { Toaster as SonnerToaster } from "sonner";

export const Toaster = () => {
  return (
    <SonnerToaster position="top-right" expand={false} richColors closeButton />
  );
};

// Re-export toast function from sonner for easy access
export { toast } from "sonner";
