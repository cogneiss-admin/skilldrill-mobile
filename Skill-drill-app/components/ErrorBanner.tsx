// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';

type Props = {
  message?: string | null;
  tone?: 'error' | 'success' | 'info';
  compact?: boolean;
  ctaText?: string;
  onCtaPress?: () => void;
  style?: ViewStyle;
};

const COLORS = {
  error: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#991B1B',
    icon: '#B91C1C',
  },
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    icon: '#059669',
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1E40AF',
    icon: '#2563EB',
  },
} as const;

export default function ErrorBanner({ message, tone = 'error', compact = false, ctaText, onCtaPress, style }: Props) {
  if (!message) return null;
  const palette = COLORS[tone];
  const responsive = useResponsive();
  
  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: responsive.card.borderRadius,
        paddingVertical: compact ? responsive.padding.xs : responsive.padding.sm,
        paddingHorizontal: compact ? responsive.padding.sm : responsive.padding.md,
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: responsive.maxWidth.form,
        alignSelf: 'center',
        width: '100%',
        ...(style || {}),
      }}
    >
      <AntDesign 
        name={tone === 'success' ? 'checkcircle' : tone === 'info' ? 'infocirlceo' : 'exclamationcircleo'} 
        size={responsive.size(18)} 
        color={palette.icon} 
      />
      <Text style={{ 
        color: palette.text, 
        marginLeft: responsive.spacing(8), 
        flex: 1, 
        fontWeight: '700', 
        fontSize: compact ? responsive.typography.caption : responsive.typography.body2 
      }}>
        {message}{' '}
        {ctaText && onCtaPress ? (
          <Text onPress={onCtaPress} style={{ 
            color: '#0A66C2', 
            textDecorationLine: 'underline',
            fontSize: compact ? responsive.typography.caption : responsive.typography.body2 
          }}>
            {ctaText}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}


