// @ts-nocheck
import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar,
  Dimensions,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { AntDesign, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";
import ActivitySkillCard from "./components/ActivitySkillCard";
import ActivitySkillCardSkeleton from "./components/ActivitySkillCardSkeleton";

const BRAND = "#0A66C2";
const GRAY = "#6B7280";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserSkill {
  id: string;
  skill: {
    id: string;
    skill_name: string;
    category: string;
    description: string;
    icon?: string;
  };
  assessment_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
  current_score?: number;
  last_assessed_at?: string;
  assessment_count?: number;
  progression_layer?: string;
  self_rating?: number;
}

interface CompletedAssessment {
  id: string;
  skillId: string;
  skillName: string;
  finalScore?: number;
  scoreLabel?: string;
  stars?: number;
  completedAt?: string;
  identifiedStyle?: string;
  improvementFeedback?: string;
  summary?: string;
}

export default function MyActivity() {
  console.log('🎯 MyActivity component loaded!');
  console.log('🎯 Activity page rendering...');
  const router = useRouter();
  const { showToast } = useToast();
  
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading activity data from backend...');
      
      const [skillsResponse, assessmentsResponse] = await Promise.all([
        apiService.get('/user/skills'),
        apiService.get('/assessment/results')
      ]);
      
      if (skillsResponse.success) {
        setUserSkills(skillsResponse.data);
        console.log('✅ User skills loaded:', skillsResponse.data.length);
      }
      if (assessmentsResponse.success) {
        setCompletedAssessments(assessmentsResponse.data || []);
        console.log('✅ Completed assessments loaded:', assessmentsResponse.data?.length || 0);
      }
      
    } catch (error) {
      console.error('❌ Error loading activity data:', error);
      showToast('error', 'Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  // Backend-only: return identifiedStyle or empty
  const getAITag = (skill: UserSkill, assessment?: CompletedAssessment) => {
    return assessment?.identifiedStyle || '';
  };

  // Backend-only: prefer improvementFeedback; fallback to summary; else empty
  const getAIInsights = (skill: UserSkill, assessment?: CompletedAssessment) => {
    if (assessment?.improvementFeedback) return assessment.improvementFeedback;
    if (assessment?.summary) return assessment.summary;
    return '';
  };

  const getScore = (assessment?: CompletedAssessment) => {
    return typeof assessment?.finalScore === 'number' ? assessment.finalScore : undefined;
  };

  const renderSkillCards = () => {
    return userSkills.map((skill, index) => {
    const completedAssessment = completedAssessments.find(a => a.skillId === skill.skill.id);
    const aiTag = getAITag(skill, completedAssessment);
      const aiInsights = getAIInsights(skill, completedAssessment);
      const score = getScore(completedAssessment);

    return (
        <ActivitySkillCard
        key={skill.id}
          id={skill.id}
          skillName={skill.skill.skill_name}
          assessmentStatus={skill.assessment_status}
          aiInsights={aiInsights}
          aiTag={aiTag}
          score={score}
          index={index}
        />
      );
    });
  };

  // Remove full-screen spinner; show skeletons in place instead

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar style="dark" />
      
      {/* Header and layout unchanged */}
      <LinearGradient colors={[BRAND, '#1E40AF', '#3B82F6']} style={{ paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../assets/images/logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
            <Text style={{ marginLeft: 10, color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>Skill Drill</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }}>
              <AntDesign name="arrowleft" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 25 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, opacity: 0.9 }}>Your Activity 📊</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginTop: 5 }}>Skill Progress</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 14, opacity: 0.8, marginTop: 5 }}>Track your assessment results and insights</Text>
        </View>
      </LinearGradient>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadActivityData} />} showsVerticalScrollIndicator={false}>
        {loading ? (
          // Shimmer skeletons while data loads
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <ActivitySkillCardSkeleton key={`skeleton-${i}`} index={i} />
            ))}
          </>
        ) : userSkills.length === 0 ? (
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 600 }} style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#1F2937', marginBottom: 40, textAlign: 'center' }}>My Skills</Text>
            {/* Empty-state illustration/CTA intentionally omitted here for brevity */}
          </MotiView>
        ) : (
          renderSkillCards()
        )}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 20, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={() => router.push('/dashboard')} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
            <AntDesign name="home" size={24} color={GRAY} />
            <Text style={{ fontSize: 12, color: GRAY, marginTop: 4, fontWeight: '400' }}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/activity')} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
            <Ionicons name="time-outline" size={24} color={BRAND} />
            <Text style={{ fontSize: 12, color: BRAND, marginTop: 4, fontWeight: '600' }}>My Activity</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


