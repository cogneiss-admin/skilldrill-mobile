// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Image, Platform, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Chip, Surface, Badge } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { useResponsive } from "../../utils/responsive";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToast } from "../../hooks/useToast";

const BRAND = "#0A66C2";
const APP_NAME = "Skill Drill";
const logoSrc = require("../../assets/images/logo.png");

// Helper function to map skill names to icons
const getSkillIcon = (skillName) => {
  const iconMap = {
    // Communication & Interpersonal
    'communication': 'message-text',
    'active listening': 'ear',
    'listening': 'ear',
    'presentation': 'presentation',
    'public speaking': 'microphone',
    'written communication': 'pencil',
    'verbal communication': 'chat',
    'email & message hygiene': 'email',
    
    // Leadership & Management
    'leadership': 'account-group',
    'team leadership': 'account-supervisor',
    'delegation': 'account-supervisor',
    'strategic thinking': 'chess-king',
    'decision making': 'check-decagram',
    'mentoring': 'account-heart',
    'coaching': 'account-star',
    
    // Problem Solving & Analysis
    'problem solving': 'lightbulb-on',
    'critical thinking': 'brain',
    'analytical thinking': 'chart-line',
    'data analysis': 'chart-bar',
    'research': 'magnify',
    'troubleshooting': 'wrench',
    
    // Teamwork & Collaboration
    'teamwork': 'account-multiple',
    'team effectiveness': 'account-group',
    'collaboration': 'account-multiple-plus',
    'conflict resolution': 'handshake',
    'cross-functional': 'account-network',
    'partnership': 'handshake',
    
    // Time & Project Management
    'time management': 'clock',
    'project management': 'clipboard-list',
    'prioritization': 'format-list-numbered',
    'deadline management': 'calendar-clock',
    'planning': 'calendar',
    'organization': 'folder-multiple',
    
    // Adaptability & Learning
    'adaptability': 'refresh',
    'flexibility': 'rotate-3d-variant',
    'learning agility': 'school',
    'continuous learning': 'book-open-variant',
    'change management': 'swap-horizontal',
    'innovation': 'lightbulb',
    
    // Creativity & Innovation
    'creativity': 'palette',
    'design thinking': 'pencil-ruler',
    'ideation': 'lightbulb-outline',
    'artistic': 'brush',
    'imagination': 'eye',
    'innovation-creativity': 'rocket-launch',
    
    // Emotional Intelligence
    'emotional intelligence': 'heart',
    'emotional regulation': 'heart',
    'empathy': 'heart-outline',
    'self-awareness': 'account-eye',
    'social skills': 'account-multiple-outline',
    'relationship building': 'account-heart-outline',
    'interpersonal': 'account-group-outline',
    
    // Influence & Persuasion
    'influence': 'handshake',
    'persuasion': 'bullhorn',
    'negotiation': 'handshake-outline',
    'stakeholder management': 'account-cog',
    'networking': 'account-network',
    'sales': 'cash-register',
    
    // Growth & Development
    'growth orientation': 'trending-up',
    'responding to feedback': 'comment-text',
    'personal development': 'account-arrow-up',
    'career development': 'briefcase-account',
    'self-improvement': 'account-edit',
    'goal setting': 'target',
    'motivation': 'run',
    
         // Personal Effectiveness
     'personal effectiveness': 'account-check',
     'self-management': 'account-cog',
     'productivity': 'speedometer',
     'efficiency': 'flash',
     'focus': 'target',
     'discipline': 'shield-check',
     'accountability': 'shield-check',
     'follow-through': 'check-decagram',
     'reliability': 'shield-check',
     'consistency': 'repeat',
     'responsibility': 'account-check',
     'commitment': 'handshake',
     'dedication': 'heart',
     'perseverance': 'run',
     'determination': 'target',
     'initiative': 'rocket-launch',
     'proactiveness': 'lightning-bolt',
     'ownership': 'account-key',
     'dependability': 'shield-check',
     'trustworthiness': 'shield-check',
    
    // Technical Skills
    'technical skills': 'code-braces',
    'programming': 'code-json',
    'data science': 'database',
    'analytics': 'chart-scatter-plot',
    'digital literacy': 'laptop',
    'automation': 'robot',
    
    // Business Skills
    'business acumen': 'briefcase',
    'financial literacy': 'currency-usd',
    'market knowledge': 'store',
    'customer focus': 'account-tie',
    'quality management': 'certificate',
    'risk management': 'shield-alert',
    
    // Default fallbacks for common variations
    'communication skills': 'message-text',
    'leadership skills': 'account-group',
    'problem-solving': 'lightbulb-on',
    'team work': 'account-multiple',
    'time-management': 'clock',
    'critical-thinking': 'brain',
    'emotional-intelligence': 'heart',
    'personal-effectiveness': 'account-check',
    'team-effectiveness': 'account-group',
    'team-leadership': 'account-supervisor'
  };
  
  const lowerName = skillName.toLowerCase().trim();
  
  // Try exact match first
  if (iconMap[lowerName]) {
    return iconMap[lowerName];
  }
  
  // Try partial matches for skills that might have variations
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return icon;
    }
  }
  
  // Smart fallback based on skill name patterns
  if (lowerName.includes('communication') || lowerName.includes('speaking') || lowerName.includes('writing')) {
    return 'message-text';
  }
  if (lowerName.includes('leadership') || lowerName.includes('management') || lowerName.includes('supervision')) {
    return 'account-group';
  }
  if (lowerName.includes('problem') || lowerName.includes('solve') || lowerName.includes('analysis')) {
    return 'lightbulb-on';
  }
  if (lowerName.includes('team') || lowerName.includes('collaboration') || lowerName.includes('group')) {
    return 'account-multiple';
  }
  if (lowerName.includes('time') || lowerName.includes('schedule') || lowerName.includes('planning')) {
    return 'clock';
  }
  if (lowerName.includes('creative') || lowerName.includes('design') || lowerName.includes('art')) {
    return 'palette';
  }
  if (lowerName.includes('emotional') || lowerName.includes('empathy') || lowerName.includes('social')) {
    return 'heart';
  }
  if (lowerName.includes('influence') || lowerName.includes('persuasion') || lowerName.includes('negotiation')) {
    return 'handshake';
  }
  if (lowerName.includes('growth') || lowerName.includes('development') || lowerName.includes('improvement')) {
    return 'trending-up';
  }
  if (lowerName.includes('personal') || lowerName.includes('self') || lowerName.includes('individual')) {
    return 'account-check';
  }
  if (lowerName.includes('technical') || lowerName.includes('technology') || lowerName.includes('digital')) {
    return 'code-braces';
  }
     if (lowerName.includes('business') || lowerName.includes('commercial') || lowerName.includes('financial')) {
     return 'briefcase';
   }
   if (lowerName.includes('accountability') || lowerName.includes('responsibility') || lowerName.includes('ownership') || lowerName.includes('reliability') || lowerName.includes('dependability')) {
     return 'shield-check';
   }
   if (lowerName.includes('follow') || lowerName.includes('through') || lowerName.includes('completion') || lowerName.includes('finish') || lowerName.includes('delivery')) {
     return 'check-decagram';
   }
   if (lowerName.includes('consistency') || lowerName.includes('reliability') || lowerName.includes('dependability')) {
     return 'repeat';
   }
   if (lowerName.includes('initiative') || lowerName.includes('proactive') || lowerName.includes('self-starter')) {
     return 'rocket-launch';
   }
   if (lowerName.includes('commitment') || lowerName.includes('dedication') || lowerName.includes('loyalty')) {
     return 'heart';
   }
   if (lowerName.includes('perseverance') || lowerName.includes('determination') || lowerName.includes('resilience')) {
     return 'run';
   }
  
  // Final fallback - use a more generic but still relevant icon
  return 'star-circle';
};

export default function SkillsScreen() {
  // Get route parameters to determine context
  const params = useLocalSearchParams();
  const isAssessmentMode = params.mode === 'assessment';
  
  // Skill data will be loaded from API
  const [skillsData, setSkillsData] = useState([]);
  const router = useRouter();
  const responsive = useResponsive();
  const { updateOnboardingStep } = useAuth();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canContinue = useMemo(() => selected.length > 0, [selected]);

  // Debug logging (only in development)
  if (__DEV__) {
    console.log('🔍 Skills Screen State:', {
      loading,
      skillsDataLength: skillsData.length,
      selectedLength: selected.length,
      isAssessmentMode,
      error
    });
  }

  // Load skills from backend and check if user already has skills
  const loadSkillsAndCheckProgress = async () => {
      try {
        // Debug: Log API configuration
        console.log('🔍 Skills: API Configuration:', {
          platform: Platform.OS,
          apiBaseUrl: Constants.expoConfig?.extra?.API_BASE_URL || 'http://10.0.2.2:3000/api',
          isDev: __DEV__,
          constants: Constants.expoConfig?.extra,
          mode: isAssessmentMode ? 'assessment' : 'signup'
        });

        // First, test connection to backend
        try {
          console.log('🔍 Skills: Testing backend connection...');
          const healthResponse = await apiService.healthCheck();
          console.log('✅ Skills: Backend connection successful:', healthResponse);
        } catch (healthError: any) {
          console.error('❌ Skills: Backend connection failed:', healthError);
          showToast('error', 'Connection Error', 'Cannot connect to server. Please check your internet connection.');
          setLoading(false);
          return;
        }

        // Both signup and assessment modes should show all available skills
        // The only difference is the button text and navigation
        console.log('🔍 Loading all available skills for', isAssessmentMode ? 'assessment' : 'signup', 'mode...');
        
        // Check if user already has skills (only for signup mode)
        if (!isAssessmentMode) {
          try {
            const userSkillsResponse = await apiService.get('/user/skills');
            if (userSkillsResponse.success && userSkillsResponse.data.length > 0) {
              console.log('✅ Skills: User already has skills selected, redirecting to dashboard');
              
              // Update onboarding step if needed
              try {
                await updateOnboardingStep('SKILLS_SELECTED');
              } catch (error) {
                console.error('❌ Failed to update onboarding step:', error);
              }
              
              // Redirect to dashboard
              router.replace("/dashboard");
              return;
            }
          } catch (userSkillsError: any) {
            // Check if this is an authentication error (401) or a network error
            if (userSkillsError.status === 401) {
              console.log('ℹ️ Skills: User not authenticated, proceeding with skill selection');
            } else if (userSkillsError.status === 404) {
              console.log('ℹ️ Skills: User has no skills selected yet, proceeding with skill selection');
            } else {
              console.log('ℹ️ Skills: Error checking user skills, proceeding with skill selection:', userSkillsError.message);
            }
          }
        }
        
        // Load available skills for selection (same for both signup and assessment modes)
        console.log('🔍 Skills: Loading skills from categories endpoint...');
        const response = await apiService.get('/skills/categories');
        
        console.log('🔍 Skills: Raw API response:', response);
        
        if (response.success) {
          console.log('✅ Skills: Successfully loaded', response.data.length, 'skill groups');
          
          // Transform the API response to match our frontend format
          const allSkills = [];
          
          response.data.forEach((group, groupIndex) => {
            console.log(`📁 Processing group ${groupIndex}: "${group.title}" with ${group.skills?.length || 0} skills`);
            if (group.skills && Array.isArray(group.skills)) {
              group.skills.forEach((skill, skillIndex) => {
                console.log(`  📝 Processing skill ${skillIndex}:`, skill);
                const skillName = skill.name || skill.skill_name;
                const icon = getSkillIcon(skillName.toLowerCase());
                
                // Debug logging to see what skill names we're getting
                console.log(`🎯 Skill: "${skillName}" -> Icon: "${icon}" (ID: ${skill.id})`);
                
                // Map skill data to our format
                const skillData = {
                  id: skill.id,
                  name: skillName,
                  description: skill.description || 'Skill description',
                  icon: icon,
                  category: group.title,
                  tier: skill.tier,
                  skill_id: skill.skill_id
                };
                
                console.log(`✅ Adding skill: ${skillName} (ID: ${skill.id})`);
                allSkills.push(skillData);
              });
            } else {
              console.log(`❌ Group "${group.title}" has no skills array or invalid format:`, group);
            }
          });
          
          console.log('📊 Skills: Transformed', allSkills.length, 'skills from', response.data.length, 'categories');
          console.log('🔍 Skills: All transformed skills:', allSkills.map(s => ({ name: s.name, id: s.id, icon: s.icon })));
          console.log('🔍 Skills: Setting skillsData with', allSkills.length, 'skills');
          setSkillsData(allSkills);
        } else {
          console.error('❌ Skills: API returned error:', response.message);
          setError(response.message || 'Failed to load skills');
        }
      } catch (error: any) {
        console.error('Skills load error:', error);
        setError(error.message || 'Failed to load skills. Please try again.');
      } finally {
        setLoading(false);
      }
    };

  // Handle retry action
  const handleRetry = useCallback(() => {
    setLoading(true);
    loadSkillsAndCheckProgress();
  }, []); // Remove dependency to prevent infinite loop

  // Load skills on component mount
  useEffect(() => {
    loadSkillsAndCheckProgress();
  }, []); // Remove dependency to prevent infinite loop

  const toggleSkill = (skillId: string) => {
    // Fire haptic feedback without blocking
    Haptics.selectionAsync().catch(() => {});
    
    setSelected((prev) => {
      const has = prev.includes(skillId);
      const newSelected = has ? prev.filter((s) => s !== skillId) : [...prev, skillId];
      console.log('Selected skills:', newSelected, 'Count:', newSelected.length);
      return newSelected;
    });
  };

  const handleContinue = async () => {
    if (!canContinue || busy) return;
    
    setBusy(true);
    
    // Fire haptic feedback without blocking
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    try {
      
      if (isAssessmentMode) {
        // Assessment mode: Start assessment with selected skills
        console.log('🎯 Assessment: Starting assessment for skills:', selected);
        console.log('📱 Navigating to assessment screen...');
        
        // Navigate to assessment screen with selected skills
        router.push({
          pathname: '/assessment',
          params: { selectedSkills: JSON.stringify(selected) }
        });
        
        console.log('✅ Navigation triggered');
        
      } else {
        // Signup mode: Save selected skills to backend
        
        // Filter out any fallback skill IDs that are not valid database IDs
        const validSkillIds = selected.filter(skillId => 
          !skillId.startsWith('fallback_') && skillId.length > 10
        );
        
        console.log('🔄 Saving skills:', validSkillIds, 'Count:', validSkillIds.length);
        console.log('❌ Filtered out invalid IDs:', selected.filter(skillId => 
          skillId.startsWith('fallback_') || skillId.length <= 10
        ));
        
        if (validSkillIds.length === 0) {
          showToast('error', 'No Valid Skills', 'Please select valid skills before continuing.');
          setBusy(false);
          return;
        }
        
        // Save selected skills to backend
        const response = await apiService.post('/user/skills', {
          skill_ids: validSkillIds
        });
        
        if (response.success) {
          console.log('✅ Skills saved successfully');
          
          // Show success toast
          showToast('success', 'Success', 'Skills saved successfully!');
          
          // Update onboarding step to indicate skills have been selected
          try {
            await updateOnboardingStep('SKILLS_SELECTED');
            console.log('✅ Onboarding step updated to SKILLS_SELECTED');
          } catch (error) {
            console.error('❌ Failed to update onboarding step:', error);
            // Continue anyway, skills were saved successfully
          }
          
          // Redirect to dashboard (assessment is now optional)
          router.replace("/dashboard");
        } else {
          showToast('error', 'Save Error', response.message || 'Failed to save skills');
        }
      }
    } catch (error) {
      console.error('Save skills error:', error);
      showToast('error', 'Save Error', 'Failed to save skills. Please try again.');
    } finally {
      setBusy(false);
    }
  };

    // Show beautiful loading state only while skills are being loaded
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
          >
            {/* Beautiful animated loader */}
            <View style={{ alignItems: "center" }}>
              {/* Logo */}
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200, delay: 200 }}
              >
                <Image 
                  source={logoSrc} 
                  style={{ 
                    width: responsive.size(80), 
                    height: responsive.size(80),
                    marginBottom: responsive.spacing(24)
                  }} 
                  resizeMode="contain" 
                />
              </MotiView>
              
              {/* Animated dots */}
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: responsive.spacing(16) }}>
                {[0, 1, 2].map((index) => (
                  <MotiView
                    key={index}
                    from={{ opacity: 0.3, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: "timing",
                      duration: 600,
                      loop: true,
                      delay: index * 200,
                    }}
                  >
                    <View
                      style={{
                        width: responsive.size(8),
                        height: responsive.size(8),
                        borderRadius: responsive.size(4),
                        backgroundColor: "#ffffff",
                        marginHorizontal: responsive.spacing(4),
                        opacity: 0.8,
                      }}
                    />
                  </MotiView>
                ))}
              </View>
            </View>
          </MotiView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND }}>
      <StatusBar style="light" />

      {/* Hero header */}
              <View style={{ minHeight: responsive.size(200), position: "relative" }}>
        <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", paddingHorizontal: responsive.padding.md, paddingTop: responsive.padding.sm }}>
            <Image source={logoSrc} style={{ width: responsive.size(56), height: responsive.size(56), shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: responsive.size(10) }} resizeMode="contain" />
            <Text style={{ marginLeft: responsive.spacing(12), color: "#ffffff", fontSize: responsive.typography.h4, fontWeight: "900", letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: responsive.size(6) }}>{APP_NAME}</Text>
        </View>
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: responsive.padding.md, paddingBottom: responsive.padding.lg }}>
          <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 480 }}>
              <Text style={{ fontSize: responsive.typography.h3, fontWeight: "900", color: "#ffffff" }}>Choose Your Skills</Text>
              <Text style={{ marginTop: responsive.spacing(8), color: "#E6F2FF", fontSize: responsive.typography.subtitle }}>Select the skills you want to improve. We&apos;ll create personalized assessments for you.</Text>
          </MotiView>
        </View>
      </View>

      {/* Content card */}
        <View style={{ flex: 1, marginTop: -responsive.size(24) }}>
          <View style={{ flex: 1, backgroundColor: "#ffffff", borderTopLeftRadius: responsive.size(24), borderTopRightRadius: responsive.size(24), paddingTop: responsive.padding.md, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: responsive.size(16) }}>
                      <ScrollView 
              contentContainerStyle={{ 
                paddingHorizontal: responsive.padding.md, 
                paddingBottom: responsive.size(200), 
                maxWidth: responsive.maxWidth.form, 
                width: '100%', 
                alignSelf: 'center' 
              }} 
              showsVerticalScrollIndicator={false}
            >
        

                    {/* Skills Grid */}
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 420 }}>
                      <Text style={{ fontSize: responsive.typography.h6, fontWeight: "900", color: "#0f172a", marginBottom: responsive.spacing(10) }}>Select Your Skills</Text>
          {skillsData.map((skill, index) => {
            const isSelected = selected.includes(skill.id);
            return (
              <MotiView 
                key={skill.id} 
                from={{ opacity: 0, translateY: 8 }} 
                animate={{ opacity: 1, translateY: 0 }} 
                transition={{ type: "timing", duration: 350, delay: index * 60 }} 
                style={{ marginBottom: 12 }}
              >
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => toggleSkill(skill.id)}
                        android_ripple={{ color: 'rgba(10, 102, 194, 0.1)', borderless: false }}
                        android_disableSound={false}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={({ pressed }) => ({
                          width: '100%',
                          paddingVertical: isSelected ? responsive.padding.lg : responsive.padding.md,
                          paddingHorizontal: isSelected ? responsive.padding.lg : responsive.padding.sm,
                          borderRadius: isSelected ? responsive.size(20) : responsive.size(16),
                          backgroundColor: "#ffffff",
                          borderWidth: isSelected ? 3 : 1,
                          borderColor: isSelected ? BRAND : "#E5E7EB",
                          shadowColor: "#000",
                          shadowOpacity: pressed ? 0.15 : isSelected ? 0.1 : 0.06,
                          shadowRadius: pressed ? responsive.size(16) : isSelected ? responsive.size(14) : responsive.size(8),
                          shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        })}
                      >
                  {isSelected ? (
                    <LinearGradient colors={["#E6F2FF", "#ffffff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, borderRadius: responsive.size(20) }} />
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Icon */}
                    <View style={{
                      width: responsive.size(44),
                      height: responsive.size(44),
                      borderRadius: responsive.size(22),
                      backgroundColor: isSelected ? BRAND : "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: responsive.spacing(10),
                    }}>
                      <MaterialCommunityIcons 
                        name={skill.icon} 
                        size={responsive.size(20)} 
                        color={isSelected ? "#ffffff" : "#6B7280"} 
                      />
                    </View>
                    
                    {/* Content */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ 
                          color: "#0f172a", 
                        fontSize: responsive.typography.h6, 
                        fontWeight: "900",
                        marginBottom: responsive.spacing(2)
                      }}>
                        {skill.name}
                      </Text>
                      <Text style={{ 
                        color: "#64748b", 
                        fontSize: responsive.typography.body2,
                        lineHeight: responsive.typography.body2 * 1.4
                      }}>
                        {skill.description}
                      </Text>
                    </View>
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <MaterialCommunityIcons name="check-circle" size={responsive.size(22)} color="#16A34A" />
                    )}
                  </View>
                      </Pressable>
              </MotiView>
                    );
                  })}
        </MotiView>
        
                {/* Skills Summary */}
        {selected.length > 0 && (
          <MotiView 
            from={{ opacity: 0, translateY: 10 }} 
            animate={{ opacity: 1, translateY: 0 }} 
            transition={{ type: "timing", duration: 300 }}
            style={{ marginTop: responsive.spacing(20), marginBottom: responsive.spacing(10) }}
          >
            <Text style={{ 
              textAlign: "center",
              color: "#64748b", 
              fontSize: responsive.typography.body2,
              fontWeight: "500"
            }}>
              {selected.length} of {skillsData.length} skills selected
            </Text>
          </MotiView>
        )}

        {/* Simple Error Display */}
        {error && (
          <MotiView 
            from={{ opacity: 0, translateY: 10 }} 
            animate={{ opacity: 1, translateY: 0 }} 
            transition={{ type: "timing", duration: 300 }}
            style={{ marginTop: responsive.spacing(16) }}
          >
            <View style={{
              backgroundColor: "#FEF2F2",
              borderLeftWidth: 4,
              borderLeftColor: "#DC2626",
              padding: responsive.padding.md,
              borderRadius: responsive.size(8),
              marginHorizontal: responsive.spacing(4)
            }}>
              <Text style={{
                color: "#DC2626",
                fontSize: responsive.typography.body2,
                fontWeight: "500"
              }}>
                {error}
              </Text>
            </View>
          </MotiView>
        )}

        {/* Bottom spacing to prevent overlap with footer */}
        <View style={{ height: responsive.size(180) }} />
          </ScrollView>
        </View>
      </View>

                    {/* Sticky footer CTA */}
          <View style={{ 
            position: "absolute", 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: "#ffffff",
            paddingHorizontal: responsive.padding.md, 
            paddingTop: responsive.spacing(16), 
            paddingBottom: responsive.padding.lg,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB"
          }}>
        <LinearGradient colors={["#0A66C2", "#0E75D1", "#1285E0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0, opacity: 0.1 }} />
            <Button
              mode="contained"
              onPress={handleContinue}
              loading={busy}
              disabled={!canContinue || busy}
              contentStyle={{ height: responsive.button.height }}
              style={{ 
                borderRadius: responsive.button.borderRadius, 
                backgroundColor: BRAND, 
                opacity: canContinue ? 1 : 0.6, 
                shadowColor: BRAND, 
                shadowOpacity: canContinue ? 0.25 : 0.1, 
                shadowRadius: responsive.size(8),
                elevation: canContinue ? 4 : 0
              }}
              labelStyle={{ 
                fontWeight: "600", 
                letterSpacing: 0.2,
                fontSize: responsive.typography.button
              }}
              buttonColor={BRAND}
              textColor="#ffffff"
              rippleColor="rgba(255, 255, 255, 0.2)"
            >
            {busy ? (isAssessmentMode ? "Starting Assessment..." : "Saving...") : 
              selected.length > 0 ? 
                (isAssessmentMode ? 
                  `Start Assessment with ${selected.length} Skill${selected.length !== 1 ? 's' : ''}` : 
                  `Continue with ${selected.length} Skill${selected.length !== 1 ? 's' : ''}`
                ) : 
                "Select at least one skill"}
            </Button>
      </View>
    </SafeAreaView>
  );
}


