import React from 'react';
import { View, Dimensions, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { COLORS, BORDER_RADIUS } from './Brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonLineProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = '100%',
  height = 14,
  radius = 8,
  style
}) => (
  <View style={[{
    width,
    height,
    borderRadius: radius || BORDER_RADIUS.md,
    backgroundColor: COLORS.border.light,
    overflow: 'hidden',
  }, style]}>
    <MotiView
      from={{ translateX: -SCREEN_WIDTH }}
      animate={{ translateX: SCREEN_WIDTH }}
      transition={{ type: 'timing', duration: 1200, loop: true }}
      style={{ width: '50%', height: '100%' }}
    >
      <LinearGradient 
        colors={[COLORS.border.light, COLORS.background.tertiary, COLORS.border.light]} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }} 
        style={{ flex: 1 }} 
      />
    </MotiView>
  </View>
);

export default SkeletonLine;