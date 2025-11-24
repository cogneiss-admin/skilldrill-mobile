/**
 * Common Types
 * Shared type definitions used across the application
 */

import { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

/**
 * Keyboard Event - for TextInput key press handlers
 */
export type KeyboardEvent = NativeSyntheticEvent<TextInputKeyPressEventData>;

/**
 * Style Type - for component style props
 */
export type ComponentStyle = StyleProp<ViewStyle | TextStyle>;

/**
 * Icon Name - for icon components that accept string names
 */
export type IconName = string;

