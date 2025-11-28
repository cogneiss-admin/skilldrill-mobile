import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolate,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BRAND, BORDER_RADIUS } from './Brand';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeButtonProps {
    onSwipeSuccess: () => void;
    loading?: boolean;
    disabled?: boolean;
}

const BUTTON_HEIGHT = SCREEN_WIDTH * 0.14;
const BUTTON_PADDING = SCREEN_WIDTH * 0.01;
const SWIPEABLE_DIMENSIONS = BUTTON_HEIGHT - 2 * BUTTON_PADDING;

const SwipeButton: React.FC<SwipeButtonProps> = ({
    onSwipeSuccess,
    loading = false,
    disabled = false,
}) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const translateX = useSharedValue(0);
    const isCompleted = useSharedValue(false);
    const [swipeComplete, setSwipeComplete] = useState(false);
    const context = useSharedValue(0);
    const shimmerOpacity = useSharedValue(0.3);

    // Shimmer effect
    useEffect(() => {
        shimmerOpacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    // Reset when loading finishes or if disabled changes
    useEffect(() => {
        if (!loading && swipeComplete) {
            // Reset logic if needed
        }
    }, [loading, swipeComplete]);

    const SWIPE_RANGE = containerWidth - SWIPEABLE_DIMENSIONS - 2 * BUTTON_PADDING;

    const handleComplete = (isFinished: boolean) => {
        if (isFinished) {
            setSwipeComplete(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSwipeSuccess();
        }
    };

    const pan = Gesture.Pan()
        .onStart(() => {
            if (disabled || loading || isCompleted.value) return;
            context.value = translateX.value;
            runOnJS(Haptics.selectionAsync)();
        })
        .onUpdate((event) => {
            if (disabled || loading || isCompleted.value) return;
            let newValue = context.value + event.translationX;
            if (newValue < 0) newValue = 0;
            if (newValue > SWIPE_RANGE) newValue = SWIPE_RANGE;
            translateX.value = newValue;
        })
        .onEnd(() => {
            if (disabled || loading || isCompleted.value) return;
            if (translateX.value > SWIPE_RANGE * 0.7) {
                // Success
                translateX.value = withSpring(SWIPE_RANGE, { damping: 20, stiffness: 200 });
                isCompleted.value = true;
                runOnJS(handleComplete)(true);
            } else {
                // Reset
                translateX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const textOpacityStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [0, SWIPE_RANGE / 3],
            [1, 0],
            Extrapolate.CLAMP
        );
        return {
            opacity,
        };
    });

    const shimmerStyle = useAnimatedStyle(() => {
        return {
            opacity: shimmerOpacity.value,
        };
    });

    const backgroundStyle = useAnimatedStyle(() => {
        return {
            width: translateX.value + SWIPEABLE_DIMENSIONS + BUTTON_PADDING,
            opacity: interpolate(translateX.value, [0, SWIPE_RANGE], [0, 1]),
        };
    });

    return (
        <View
            style={[styles.container, disabled && styles.disabledContainer]}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            {/* Progress Background */}
            <Animated.View style={[styles.progressBackground, backgroundStyle]} />

            {/* Swipe Text */}
            <Animated.View style={[styles.textContainer, textOpacityStyle]}>
                <Animated.Text style={[styles.text, shimmerStyle]}>Swipe to pay</Animated.Text>
                <View style={styles.chevrons}>
                    <Animated.View style={shimmerStyle}>
                        <Ionicons name="chevron-forward" size={SCREEN_WIDTH * 0.035} color="rgba(255,255,255,0.5)" />
                    </Animated.View>
                    <Animated.View style={shimmerStyle}>
                        <Ionicons name="chevron-forward" size={SCREEN_WIDTH * 0.035} color="rgba(255,255,255,0.7)" style={{ marginLeft: -SCREEN_WIDTH * 0.015 }} />
                    </Animated.View>
                    <Animated.View style={shimmerStyle}>
                        <Ionicons name="chevron-forward" size={SCREEN_WIDTH * 0.035} color="#FFFFFF" style={{ marginLeft: -SCREEN_WIDTH * 0.015 }} />
                    </Animated.View>
                </View>
            </Animated.View>

            {/* Slider Button */}
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.thumb, animatedStyle]}>
                    {loading ? (
                        <ActivityIndicator color={BRAND} size="small" />
                    ) : (
                        <Ionicons name="arrow-forward" size={SCREEN_WIDTH * 0.06} color={BRAND} />
                    )}
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: BUTTON_HEIGHT,
        backgroundColor: BRAND,
        borderRadius: SCREEN_WIDTH * 0.075,
        justifyContent: 'center',
        padding: BUTTON_PADDING,
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
    },
    disabledContainer: {
        opacity: 0.6,
    },
    progressBackground: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.2)',
        zIndex: 0,
    },
    textContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    text: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: SCREEN_WIDTH * 0.035,
        marginRight: SCREEN_WIDTH * 0.02,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    chevrons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    thumb: {
        width: SWIPEABLE_DIMENSIONS,
        height: SWIPEABLE_DIMENSIONS,
        borderRadius: SWIPEABLE_DIMENSIONS / 2,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
});

export default SwipeButton;
