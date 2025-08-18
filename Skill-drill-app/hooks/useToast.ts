// @ts-nocheck
import { useState, useCallback, useRef, useEffect } from 'react';
import { ToastType } from '../components/ToastNotification';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onPress?: () => void;
  actionText?: string;
  showIcon?: boolean;
  position?: 'top' | 'bottom';
}

interface UseToastReturn {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (message: string, options?: Partial<Toast>) => void;
  showError: (message: string, options?: Partial<Toast>) => void;
  showWarning: (message: string, options?: Partial<Toast>) => void;
  showInfo: (message: string, options?: Partial<Toast>) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear all timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  const generateId = useCallback(() => {
    return `toast-${nextId.current++}`;
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    if (!isMountedRef.current) return;
    
    const id = generateId();
    const newToast: Toast = {
      id,
      type: 'info',
      duration: 4000,
      showIcon: true,
      position: 'top',
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          dismissToast(id);
        }
        timeoutRefs.current.delete(id);
      }, newToast.duration);
      
      timeoutRefs.current.set(id, timeoutId);
    }
  }, [generateId]);

  const showSuccess = useCallback((message: string, options?: Partial<Toast>) => {
    showToast({
      type: 'success',
      message,
      ...options,
    });
  }, [showToast]);

  const showError = useCallback((message: string, options?: Partial<Toast>) => {
    showToast({
      type: 'error',
      message,
      duration: 6000, // Longer duration for errors
      ...options,
    });
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: Partial<Toast>) => {
    showToast({
      type: 'warning',
      message,
      ...options,
    });
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: Partial<Toast>) => {
    showToast({
      type: 'info',
      message,
      ...options,
    });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    if (!isMountedRef.current) return;
    
    // Clear timeout if exists
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
    
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    dismissAll,
  };
}
