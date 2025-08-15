import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../assets/images/logo.png");

type Skill = {
  id: string;
  skill_id: string;
  name: string;
  description?: string;
  tier?: string;
  sub_skills_count?: number;
};

type SkillGroup = {
  title: string;
  skills: Skill[];
};

export default function AssessmentSkillSelectionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [error, setError] = useState("");
  const [userSkills, setUserSkills] = useState<Skill[]>([]);

  const canContinue = selected.length > 0;

  // Load user's selected skills and available skills for assessment
  const loadSkills = async () => {
    try {
      console.log('🔍 Assessment: Loading user skills...');
      
      // First, get user's selected skills
      const userSkillsResponse = await apiService.get('/user/skills');
      if (userSkillsResponse.success && userSkillsResponse.data.length > 0) {
        console.log('✅ Assessment: User has', userSkillsResponse.data.length, 'skills selected');
        setUserSkills(userSkillsResponse.data);
      } else {
        console.log('ℹ️ Assessment: User has no skills selected');
        setError('Please select skills first before taking an assessment');
        setLoading(false);
        return;
      }

      // Load available skills for assessment
      console.log('🔍 Assessment: Loading skills from categories endpoint...');
      const response = await apiService.get('/skills/categories');
      
      if (response.success) {
        console.log('✅ Assessment: Successfully loaded', response.data.length, 'skill groups');
        setSkillGroups(response.data);
      } else {
        console.error('❌ Assessment: API returned error:', response.message);
        setError(response.message || 'Failed to load skills');
      }
    } catch (error: any) {
      console.error('Assessment load skills error:', error);
      setError(error.message || 'Failed to load skills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const toggleSkill = (skillId: string) => {
    setSelected((prev) => {
      const has = prev.includes(skillId);
      if (has) return prev.filter((s) => s !== skillId);
      return [...prev, skillId];
    });
  };

  const handleStartAssessment = async () => {
    if (!canContinue || busy) return;
    setBusy(true);
    try {
      console.log('🎯 Assessment: Starting assessment for skills:', selected);
      
      // Navigate to assessment screen with selected skills
      router.push({
        pathname: '/assessment',
        params: { selectedSkills: JSON.stringify(selected) }
      });
      
    } catch (error) {
      console.error('Assessment start error:', error);
      setError('Failed to start assessment. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleBackToDashboard = () => {
    router.back();
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        <View style={{ 
          flex: 1, 
          justifyContent: "center", 
          alignItems: "center", 
          paddingHorizontal: 20 
        }}>
          <View style={{ 
            width: 60, 
            height: 60, 
            borderRadius: 30,
            backgroundColor: "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16
          }}>
            <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "900" }}>🎯</Text>
          </View>
          <Text style={{ 
            color: "#ffffff", 
            fontSize: 16, 
            fontWeight: "600",
            textAlign: "center"
          }}>
            Loading assessment skills...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 10, 
        paddingBottom: 20 
      }}>
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          justifyContent: "space-between" 
        }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={logoSrc} style={{ width: 40, height: 40 }} resizeMode="contain" />
            <Text style={{ 
              marginLeft: 10, 
              color: "#ffffff", 
              fontSize: 18, 
              fontWeight: "900", 
              letterSpacing: 0.4 
            }}>{APP_NAME}</Text>
          </View>
          
          <Pressable
            onPress={handleBackToDashboard}
            style={({ pressed }) => ({
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ 
              color: "#ffffff", 
              fontSize: 14, 
              fontWeight: "600" 
            }}>← Back</Text>
          </Pressable>
        </View>

        {/* Hero content */}
        <View style={{ 
          alignItems: "center", 
          paddingTop: 20,
          paddingBottom: 20
        }}>
          <View style={{ 
            width: 80, 
            height: 80, 
            borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.15)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 32, fontWeight: "900" }}>🎯</Text>
          </View>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: "900", 
            color: "#ffffff",
            textAlign: "center",
            marginBottom: 8
          }}>Choose Skills to Assess</Text>
          <Text style={{ 
            color: "#E6F2FF", 
            fontSize: 16,
            textAlign: "center",
            lineHeight: 22
          }}>Select the skills you want to assess today</Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ 
        flex: 1, 
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24,
        paddingTop: 20
      }}>
        <ScrollView 
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingBottom: 120
          }} 
          showsVerticalScrollIndicator={false}
        >
          {/* Error message */}
          {error ? (
            <View style={{ 
              backgroundColor: "#fef2f2", 
              borderColor: "#fca5a5", 
              borderWidth: 1, 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 16 
            }}>
              <Text style={{ 
                color: "#dc2626", 
                fontSize: 14, 
                fontWeight: "600", 
                marginBottom: 12,
                textAlign: "center"
              }}>
                {error}
              </Text>
              <Pressable
                onPress={() => {
                  setError("");
                  setLoading(true);
                  loadSkills();
                }}
                style={({ pressed }) => ({
                  backgroundColor: "#dc2626",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  alignSelf: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ 
                  color: "#ffffff", 
                  fontSize: 14, 
                  fontWeight: "600" 
                }}>
                  Try Again
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Selected count */}
          {selected.length > 0 ? (
            <View style={{ 
              marginBottom: 20,
              backgroundColor: "#f0f9ff",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#bae6fd"
            }}>
              <Text style={{ 
                color: BRAND, 
                fontSize: 16, 
                fontWeight: "700",
                marginBottom: 4
              }}>
                {selected.length} skill{selected.length !== 1 ? 's' : ''} selected
              </Text>
              <Text style={{ 
                color: "#64748b", 
                fontSize: 14,
                textAlign: "center"
              }}>
                Ready to start your assessment
              </Text>
            </View>
          ) : (
            <View style={{ 
              marginBottom: 20,
              backgroundColor: "#f8fafc",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#e2e8f0"
            }}>
              <Text style={{ 
                color: "#64748b", 
                fontSize: 16, 
                fontWeight: "600",
                textAlign: "center"
              }}>
                Select skills from your profile to assess
              </Text>
            </View>
          )}

          {/* Skill groups */}
          {skillGroups.map((group, gIdx) => (
            <View key={group.title} style={{ marginBottom: 24 }}>
              <View style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                marginBottom: 16 
              }}>
                <View style={{ 
                  width: 4, 
                  height: 20, 
                  backgroundColor: BRAND, 
                  borderRadius: 2,
                  marginRight: 12
                }} />
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: "900", 
                  color: "#0f172a",
                  flex: 1
                }}>{group.title}</Text>
              </View>
              
              <View style={{ 
                flexDirection: "row", 
                flexWrap: "wrap",
                gap: 12
              }}>
                {group.skills.map((skill) => {
                  const isSelected = selected.includes(skill.id);
                  const isUserSkill = userSkills.some(us => us.id === skill.id);
                  
                  return (
                    <Pressable
                      key={skill.id}
                      onPress={() => toggleSkill(skill.id)}
                      style={({ pressed }) => ({
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? BRAND : "#E5E7EB",
                        backgroundColor: isSelected ? "#F0F7FF" : "#ffffff",
                        shadowColor: "#000",
                        shadowOpacity: pressed ? 0.1 : 0.05,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        opacity: isUserSkill ? 1 : 0.6,
                        minWidth: 120,
                        flex: 1,
                        maxWidth: 200,
                      })}
                    >
                      <Text style={{ 
                        color: "#0f172a", 
                        fontWeight: "700",
                        fontSize: 14,
                        textAlign: "center",
                        marginBottom: 4
                      }}>
                        {skill.name}
                      </Text>
                      {!isUserSkill && (
                        <Text style={{ 
                          color: "#64748b", 
                          fontSize: 12,
                          textAlign: "center",
                          fontStyle: "italic"
                        }}>Not in your skills</Text>
                      )}
                      {isSelected && (
                        <View style={{ 
                          position: "absolute", 
                          top: 8, 
                          right: 8,
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: BRAND,
                          justifyContent: "center",
                          alignItems: "center"
                        }}>
                          <Text style={{ 
                            color: "#ffffff", 
                            fontSize: 10, 
                            fontWeight: "900" 
                          }}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={{ 
          position: "absolute", 
          left: 0, 
          right: 0, 
          bottom: 0, 
          paddingHorizontal: 20, 
          paddingTop: 16, 
          paddingBottom: 20,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9"
        }}>
          <View style={{ 
            flexDirection: "row", 
            gap: 12,
            alignItems: "center"
          }}>
            <Button
              mode="outlined"
              onPress={handleBackToDashboard}
              style={{ 
                flex: 1,
                borderColor: BRAND,
                borderWidth: 2,
                borderRadius: 12,
                height: 48
              }}
              labelStyle={{ 
                fontWeight: "700", 
                color: BRAND,
                fontSize: 16
              }}
            >
              Back
            </Button>
            <Button
              mode="contained"
              onPress={handleStartAssessment}
              loading={busy}
              disabled={!canContinue || busy}
              contentStyle={{ height: 48 }}
              style={{ 
                flex: 2,
                borderRadius: 12, 
                backgroundColor: BRAND, 
                opacity: canContinue ? 1 : 0.6,
              }}
              labelStyle={{ 
                fontWeight: "800", 
                letterSpacing: 0.3,
                fontSize: 16
              }}
            >
              {busy ? "Starting..." : "Start Assessment"}
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
