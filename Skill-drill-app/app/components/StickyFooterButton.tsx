// @ts-nocheck
import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const DEFAULT_BRAND = '#0A66C2';

export function StickyFooterButton({
  brand = DEFAULT_BRAND,
  label,
  onPress,
  loading,
  disabled,
}: {
  brand?: string;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 34, zIndex: 1000, backgroundColor: '#ffffff' }}>
      <LinearGradient colors={[brand, '#0E75D1', '#1285E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />
      <Button
        mode="contained"
        onPress={onPress}
        loading={!!loading}
        disabled={!!disabled}
        contentStyle={{ height: 56 }}
        style={{ borderRadius: 28, backgroundColor: brand, opacity: disabled ? 0.7 : 1, shadowColor: brand, shadowOpacity: 0.35, shadowRadius: 14 }}
        labelStyle={{ fontWeight: '800', letterSpacing: 0.3 }}
      >
        {label}
      </Button>
    </View>
  );
}

export default StickyFooterButton;


