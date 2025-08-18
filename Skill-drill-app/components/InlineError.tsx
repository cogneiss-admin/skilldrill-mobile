// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';

interface InlineErrorProps {
  message?: string | null;
  showIcon?: boolean;
  style?: any;
}

export default function InlineError({ message, showIcon = false, style }: InlineErrorProps) {
  const responsive = useResponsive();

  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <AntDesign
          name="exclamationcircleo"
          size={responsive.size(14)}
          color="#B91C1C"
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            fontSize: responsive.typography.body2,
            color: '#991B1B',
          },
        ]}
        numberOfLines={1}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontWeight: '500',
    lineHeight: 18,
  },
});
