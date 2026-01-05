import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AIJobStatusType } from '../../types/api';
import { BRAND, COLORS, SPACING, BORDER_RADIUS } from './Brand';

interface AIProgressIndicatorProps {
  status: AIJobStatusType;
  message: string;
  onRetry?: () => void;
  onCancel?: () => void;
  showRetry?: boolean;
  showCancel?: boolean;
}

const STATUS_COLORS: Record<AIJobStatusType, string> = {
  pending: '#FFA500',           // Orange
  running: BRAND,               // Brand blue
  runningSecondary: '#8B4513',  // Brown (fallback indicator)
  completed: COLORS.success,    // Green
  failed: COLORS.error          // Red
};

const getStatusLabel = (status: AIJobStatusType): string => {
  switch (status) {
    case 'pending':
      return 'Preparing...';
    case 'running':
      return 'Processing...';
    case 'runningSecondary':
      return 'Taking longer than usual...';
    case 'completed':
      return 'Complete';
    case 'failed':
      return 'Failed';
    default:
      return 'Processing...';
  }
};

const AIProgressIndicator: React.FC<AIProgressIndicatorProps> = ({
  status,
  message,
  onRetry,
  onCancel,
  showRetry = false,
  showCancel = false
}) => {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const isProcessing = status === 'pending' || status === 'running' || status === 'runningSecondary';

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        {isProcessing && (
          <ActivityIndicator size="small" color={statusColor} style={styles.spinner} />
        )}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {getStatusLabel(status)}
        </Text>
      </View>

      <Text style={styles.message}>{message}</Text>

      {(showRetry || showCancel) && (
        <View style={styles.actions}>
          {showRetry && onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          {showCancel && onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.padding.lg,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  spinner: {
    marginRight: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  retryButton: {
    backgroundColor: BRAND,
    paddingHorizontal: SPACING.padding.xl,
    paddingVertical: SPACING.padding.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.white,
    paddingHorizontal: SPACING.padding.xl,
    paddingVertical: SPACING.padding.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AIProgressIndicator;
