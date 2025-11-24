import React from 'react';
import { View, StyleSheet } from 'react-native';
import ToastNotification from './ToastNotification';
import { useResponsive } from '../utils/responsive';

interface ToastContainerProps {
  toasts: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
    onPress?: () => void;
    actionText?: string;
    showIcon?: boolean;
    position?: 'top' | 'bottom';
  }[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const responsive = useResponsive();

  // Group toasts by position
  const topToasts = toasts.filter(toast => toast.position !== 'bottom');
  const bottomToasts = toasts.filter(toast => toast.position === 'bottom');

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top toasts */}
      <View style={styles.topContainer} pointerEvents="box-none">
        {topToasts.map((toast, index) => (
          <View
            key={toast.id}
            style={[
              styles.toastWrapper,
              {
                marginTop: index > 0 ? responsive.spacing(8) : 0,
              },
            ]}
          >
            <ToastNotification
              visible={true}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onDismiss={() => onDismiss(toast.id)}
              onPress={toast.onPress}
              actionText={toast.actionText}
              showIcon={toast.showIcon}
              position="top"
            />
          </View>
        ))}
      </View>

      {/* Bottom toasts */}
      <View style={styles.bottomContainer} pointerEvents="box-none">
        {bottomToasts.map((toast, index) => (
          <View
            key={toast.id}
            style={[
              styles.toastWrapper,
              {
                marginBottom: index > 0 ? responsive.spacing(8) : 0,
              },
            ]}
          >
            <ToastNotification
              visible={true}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onDismiss={() => onDismiss(toast.id)}
              onPress={toast.onPress}
              actionText={toast.actionText}
              showIcon={toast.showIcon}
              position="bottom"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  toastWrapper: {
    // This wrapper helps with proper spacing between toasts
  },
});
