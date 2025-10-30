// @ts-nocheck
import React, { useEffect, useRef } from "react";
import { TextInput, View, useWindowDimensions } from "react-native";
import { useResponsive } from "../utils/responsive";

type Props = {
  length?: number;
  value: string[];
  onChange: (next: string[]) => void;
  color?: string;
  error?: boolean;
  focusIndex?: number | undefined;
};

const DEFAULT_BRAND = "#0A66C2";

export default function CodeBoxes({ length = 6, value, onChange, color = DEFAULT_BRAND, error = false, focusIndex }: Props) {
  const refs = useRef(Array.from({ length }, () => React.createRef<any>())).current;
  const { width } = useWindowDimensions();
  const responsive = useResponsive();
  const [focused, setFocused] = React.useState<number | null>(null);

  // Responsive sizing: try to fit within screen padding
  const horizontalPadding = responsive.padding.lg * 2; // container paddings
  const gap = responsive.spacing(12);
  const maxPerBox = Math.min(responsive.size(56), Math.floor((width - horizontalPadding - (length - 1) * gap) / length));
  const boxSize = Math.max(responsive.size(44), maxPerBox);
  const fontSize = responsive.fontSize(Math.max(18, Math.min(22, Math.floor(boxSize * 0.38))));

  useEffect(() => {
    // Auto focus the first empty box when component mounts
    const firstEmptyIndex = value.findIndex((v) => !v);
    const idx = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
    refs[idx]?.current?.focus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Imperatively focus a specific index when requested
  useEffect(() => {
    if (typeof focusIndex === 'number' && focusIndex >= 0 && focusIndex < length) {
      refs[focusIndex]?.current?.focus?.();
    }
  }, [focusIndex, length, refs]);

  const handleChange = (index: number, text: string) => {
    const t = text.replace(/\D/g, "");
    // If user pastes multiple digits anywhere, spread them across boxes from current index
    if (t.length > 1) {
      const next = [...value];
      const digits = t.slice(0, length - index).split("");
      digits.forEach((d, i) => {
        next[index + i] = d;
      });
      onChange(next);
      const last = Math.min(index + digits.length - 1, length - 1);
      refs[last]?.current?.focus?.();
      return;
    }
    const next = [...value];
    if (t.length === 0) {
      // User deleted current box, move focus left automatically
      next[index] = "";
      onChange(next);
      if (index > 0) refs[index - 1]?.current?.focus?.();
      return;
    }
    next[index] = t.slice(-1);
    onChange(next);
    if (index < length - 1) refs[index + 1]?.current?.focus?.();
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key !== "Backspace") return;
    const next = [...value];
    if (value[index]) {
      // Clear current and move left for fast erase
      next[index] = "";
      onChange(next);
      if (index > 0) refs[index - 1]?.current?.focus?.();
      return;
    }
    if (!value[index] && index > 0) {
      // Clear previous and focus it
      next[index - 1] = "";
      onChange(next);
      refs[index - 1]?.current?.focus?.();
    }
  };

  return (
    <View style={{ 
      flexDirection: "row", 
      justifyContent: "space-between", 
      paddingHorizontal: responsive.padding.sm,
      maxWidth: responsive.maxWidth.form,
      alignSelf: 'center',
      width: '100%'
    }}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={refs[i]}
          value={value[i] || ""}
          keyboardType="numeric"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          importantForAutofill="yes"
          autoCorrect={false}
          maxLength={1}
          onChangeText={(t) => handleChange(i, t)}
          onKeyPress={(e) => handleKeyPress(i, e)}
          onFocus={() => {
            try {
              // Select existing digit to overwrite quickly
              refs[i]?.current?.setNativeProps?.({ selection: { start: 0, end: (value[i] || "").length } });
            } catch {}
            setFocused(i);
          }}
          onBlur={() => setFocused((prev) => (prev === i ? null : prev))}
          style={{
            width: boxSize,
            height: Math.max(responsive.size(52), Math.floor(boxSize * 1.2)),
            borderRadius: focused === i ? responsive.size(14) : responsive.size(12),
            borderWidth: 2,
            borderColor: error ? "#DC2626" : (focused === i || value[i] ? color : "#E5E7EB"),
            backgroundColor: "#ffffff",
            textAlign: "center",
            fontSize,
            fontWeight: "700",
            color: "#111827",
          }}
          returnKeyType="done"
        />
      ))}
    </View>
  );
}


