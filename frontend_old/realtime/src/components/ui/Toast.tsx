import { Toaster as SonnerToaster } from "sonner";

export const Toaster = () => {
  return (
    <SonnerToaster
      position="top-right"
      theme="dark"
      offset={{ top: 75, right: 16 }}
      richColors
    />
  );
};
