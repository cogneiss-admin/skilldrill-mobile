import React from "react";
import { View, Text } from "react-native";
import { MotiView } from "moti";
import SkillCard from "./SkillCard";
import EnhancedSkillCard from "./EnhancedSkillCard";

export function AdaptiveTierSection({
  tierKey,
  title,
  icon,
  skills,
  selectedIds,
  onToggle,
  brand = "#0A66C2",
  skillsWithAssessments = new Set(),
  isAssessmentMode = false,
  onTraditionalAssessment,
}: {
  tierKey: string;
  title: string;
  icon: string;
  skills: any[];
  selectedIds: (string | number)[];
  onToggle: (id: string | number) => void;
  brand?: string;
  skillsWithAssessments?: Set<string>;
  isAssessmentMode?: boolean;
  onTraditionalAssessment?: (skill: any) => void;
}) {
  return (
    <View key={tierKey} style={{ marginBottom: 32 }}>
      <MotiView 
        from={{ opacity: 0, translateY: 8 }} 
        animate={{ opacity: 1, translateY: 0 }} 
        transition={{ type: "timing", duration: 420, delay: 100 }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
          paddingHorizontal: 20
        }}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>
            {icon}
          </Text>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: "700", 
            color: "#111827"
          }}>
            {title}
          </Text>
        </View>
      </MotiView>

      <View style={{ paddingHorizontal: 20 }}>
        {skills.map((skill, index) => (
          <MotiView 
            key={skill.id} 
            from={{ opacity: 0, translateY: 8 }} 
            animate={{ opacity: 1, translateY: 0 }} 
            transition={{ type: "timing", duration: 350, delay: index * 60 }}
            style={{ marginBottom: isAssessmentMode ? 0 : 12 }}
          >
            {isAssessmentMode ? (
              <EnhancedSkillCard
                skill={skill}
                index={index}
                brand={brand}
                hasAssessment={skillsWithAssessments.has(skill.mongo_id)}
                onTraditionalAssessment={onTraditionalAssessment}
              />
            ) : (
              <SkillCard
                skill={skill}
                isSelected={selectedIds.includes(skill.id)}
                brand={brand}
                onPress={() => onToggle(skill.id)}
                index={index}
                hasAssessment={skillsWithAssessments.has(skill.mongo_id)}
              />
            )}
          </MotiView>
        ))}
      </View>
    </View>
  );
}

export default AdaptiveTierSection;