import { toast as sonnerToast } from "sonner";

// Re-export sonner toast with a wrapper that handles the Shadcn toast API
// This allows existing code to work without changes

interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  duration?: number;
}

function toast(options: ToastOptions) {
  const { title, description, variant, duration } = options;
  
  if (variant === "destructive") {
    return sonnerToast.error(title as string, {
      description: description as string,
      duration: duration,
    });
  }
  
  return sonnerToast(title as string, {
    description: description as string,
    duration: duration,
  });
}

// Legacy useToast hook for compatibility
function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [] as any[],
  };
}

export { useToast, toast };
