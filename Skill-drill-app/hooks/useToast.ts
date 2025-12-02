import { useToastContext } from '../contexts/ToastContext';

// Re-export the context hook as useToast for backward compatibility
export function useToast() {
  return useToastContext();
}
