// @ts-nocheck
import React, { useRef } from "react";
import { TextInput, View } from "react-native";

type Props = {
  length?: number;
  value: string[];
  onChange: (next: string[]) => void;
  color?: string;
};

const DEFAULT_BRAND = "#0A66C2";

export default function CodeBoxes({ length = 6, value, onChange, color = DEFAULT_BRAND }: Props) {
  const refs = Array.from({ length }, () => useRef(null));

  const handleChange = (index: number, text: string) => {
    const t = text.replace(/\D/g, "");
    if (index === 0 && t.length > 1) {
      const next = new Array(length).fill("");
      t.slice(0, length).split("").forEach((d, i) => (next[i] = d));
      onChange(next);
      refs[Math.min(t.length, length) - 1]?.current?.focus?.();
      return;
    }
    const next = [...value];
    next[index] = t.slice(-1);
    onChange(next);
    if (t && index < length - 1) refs[index + 1]?.current?.focus?.();
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      const next = [...value];
      next[index - 1] = "";
      onChange(next);
      refs[index - 1]?.current?.focus?.();
    }
  };

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12 }}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={refs[i]}
          value={value[i] || ""}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(t) => handleChange(i, t)}
          onKeyPress={(e) => handleKeyPress(i, e)}
          style={{
            width: 48,
            height: 58,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: value[i] ? color : "#E5E7EB",
            backgroundColor: "#ffffff",
            textAlign: "center",
            fontSize: 20,
            fontWeight: "700",
            color: "#111827",
          }}
        />
      ))}
    </View>
  );
}


