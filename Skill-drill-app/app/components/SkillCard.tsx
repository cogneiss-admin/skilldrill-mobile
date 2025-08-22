// @ts-nocheck
import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from '@expo/vector-icons';

type Skill = {
  id: string | number;
  name?: string;
  category?: string;
};

export function SkillCard({
  skill,
  isSelected,
  onPress,
  brand = "#0A66C2",
  index = 0,
}: {
  skill: Skill;
  isSelected: boolean;
  onPress: () => void;
  brand?: string;
  index?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: "#ffffff",
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? brand : "#E5E7EB",
        shadowColor: "#000",
        shadowOpacity: pressed ? 0.12 : 0.06,
        shadowRadius: pressed ? 12 : 8,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        marginBottom: 12,
      })}
    >
      {isSelected ? (
        <LinearGradient colors={["#E6F2FF", "#ffffff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, borderRadius: 16 }} />
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#0f172a", fontSize: 15, fontWeight: "900" }}>
            {skill.name || 'Unknown Skill'}
          </Text>
          <Text style={{ color: "#64748b", marginTop: 4 }}>
            {skill.category ? String(skill.category).replace(/_/g, ' ') : 'Personal Effectiveness'}
          </Text>
        </View>
        {isSelected ? <AntDesign name="checkcircle" size={22} color="#16A34A" /> : null}
      </View>
    </Pressable>
  );
}

export default SkillCard;


