// @ts-nocheck
import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Animated } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';

interface FormFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  showErrorIcon?: boolean;
  animated?: boolean;
}

export default function FormField({
  label,
  error,
  helperText,
  required = false,
  showErrorIcon = false,
  animated = true,
  style,
  ...textInputProps
}: FormFieldProps) {
  const responsive = useResponsive();
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (error && animated) {
      // Shake animation for errors
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, animated]);

  const inputContainerStyle = [
    styles.inputContainer,
    {
      borderColor: error ? '#FCA5A5' : '#D1D5DB',
      borderWidth: error ? 2 : 1,
      borderRadius: responsive.card.borderRadius,
      paddingHorizontal: responsive.padding.md,
      paddingVertical: responsive.padding.sm,
      backgroundColor: error ? '#FEF2F2' : '#FFFFFF',
    },
    style,
  ];

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[
            styles.label,
            {
              fontSize: responsive.typography.body2,
              fontWeight: '600',
              color: error ? '#991B1B' : '#374151',
            }
          ]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <Animated.View
        style={[
          inputContainerStyle,
          {
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                fontSize: responsive.typography.body2,
                color: error ? '#991B1B' : '#111827',
              },
            ]}
            placeholderTextColor={error ? '#FCA5A5' : '#9CA3AF'}
            {...textInputProps}
          />
          
          {error && showErrorIcon && (
            <View style={styles.errorIcon}>
              <AntDesign name="exclamationcircleo" size={16} color="#B91C1C" />
            </View>
          )}
        </View>
      </Animated.View>

      {(error || helperText) && (
        <View style={styles.messageContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              {showErrorIcon && (
                <AntDesign name="exclamationcircleo" size={12} color="#B91C1C" style={styles.errorIconSmall} />
              )}
              <Text style={[
                styles.errorText,
                {
                  fontSize: responsive.typography.caption,
                  color: '#991B1B',
                }
              ]}>
                {error}
              </Text>
            </View>
          ) : (
            <Text style={[
              styles.helperText,
              {
                fontSize: responsive.typography.caption,
                color: '#6B7280',
              }
            ]}>
              {helperText}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    lineHeight: 20,
  },
  required: {
    color: '#DC2626',
  },
  inputContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  errorIcon: {
    marginLeft: 8,
  },
  errorIconSmall: {
    marginRight: 4,
  },
  messageContainer: {
    marginTop: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    lineHeight: 16,
  },
  helperText: {
    lineHeight: 16,
  },
});
