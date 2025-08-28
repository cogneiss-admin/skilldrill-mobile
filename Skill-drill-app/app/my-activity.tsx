// @ts-nocheck
import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar,
  Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { AntDesign, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";

const BRAND = "#0A66C2";
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
  finalScore: number;
  scoreLabel?: string;
  stars?: number;
  completedAt?: string;
  identifiedStyle?: string;
}

export default function MyActivity() {
  console.log('🎯 MyActivity component loaded!');
  const router = useRouter();
  const { showToast } = useToast();
  
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'in-progress' | 'not-started'>('all');

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUserSkills(), loadCompletedAssessments()]);
    } catch (error) {
      console.error('Error loading activity data:', error);
      showToast('error', 'Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const loadUserSkills = async () => {
    try {
      const response = await apiService.get('/user/skills');
      
      if (response && response.success) {
        setUserSkills(response.data || []);
      } else {
        showToast('error', 'Failed to load skills', response?.message || 'Unknown error');
      }
    } catch (error) {
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        showToast('error', 'Authentication required', 'Please login again');
      } else if (error.code === 'NETWORK_ERROR') {
        showToast('error', 'Network error', 'Cannot connect to server');
      } else {
        showToast('error', 'Failed to load skills', error.message || 'Unknown error');
      }
    }
  };

  const loadCompletedAssessments = async () => {
    try {
      const response = await apiService.get('/assessment/results');
      
      if (response.success) {
        setCompletedAssessments(response.data || []);
      } else {
        showToast('error', 'Failed to load assessments', response.message);
      }
    } catch (error) {
      showToast('error', 'Failed to load assessments', 'Network error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivityData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#10B981';
      case 'IN_PROGRESS': return '#F59E0B';
      case 'PENDING':
      case 'NOT_STARTED': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'check-circle';
      case 'IN_PROGRESS': return 'clock-circle';
      case 'PENDING':
      case 'NOT_STARTED': return 'minus-circle';
      default: return 'minus-circle';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'IN_PROGRESS': return 'In Progress';
      case 'PENDING': return 'Pending';
      case 'NOT_STARTED': return 'Not Started';
      default: return 'Not Started';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#059669';
    if (score >= 70) return '#0D9488';
    if (score >= 60) return '#DC2626';
    return '#991B1B';
  };

  const getLevelLabel = (score: number) => {
    if (score >= 90) return 'Expert';
    if (score >= 80) return 'Advanced';
    if (score >= 70) return 'Intermediate';
    if (score >= 60) return 'Beginner';
    return 'Needs Improvement';
  };

  const getSkillIcon = (skillName: string) => {
    const name = skillName.toLowerCase();
    if (name.includes('communication')) return 'message-circle';
    if (name.includes('leadership')) return 'users';
    if (name.includes('problem')) return 'bulb';
    if (name.includes('team')) return 'users';
    if (name.includes('time')) return 'clock';
    if (name.includes('conflict')) return 'alert-triangle';
    if (name.includes('decision')) return 'check-square';
    if (name.includes('creativity')) return 'star';
    if (name.includes('adaptability')) return 'refresh-cw';
    if (name.includes('emotional')) return 'heart';
    return 'book';
  };

  const getAITag = (skill: UserSkill, completedAssessment?: CompletedAssessment) => {
    if (skill.assessment_status === 'COMPLETED' && completedAssessment?.identifiedStyle) {
      return completedAssessment.identifiedStyle;
    }
    
    // Generate tags based on skill name and status
    const skillName = skill.skill.skill_name.toLowerCase();
    if (skillName.includes('communication')) return 'Collaborative Communicator';
    if (skillName.includes('leadership')) return 'Natural Leader';
    if (skillName.includes('problem')) return 'Strategic Thinker';
    if (skillName.includes('team')) return 'Team Player';
    if (skillName.includes('time')) return 'Efficient Planner';
    if (skillName.includes('conflict')) return 'Peacemaker';
    if (skillName.includes('decision')) return 'Decisive';
    if (skillName.includes('creativity')) return 'Innovative';
    if (skillName.includes('adaptability')) return 'Flexible';
    if (skillName.includes('emotional')) return 'Empathetic';
    
    return 'Skill Enthusiast';
  };

  const filteredSkills = userSkills.filter(skill => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'completed') return skill.assessment_status === 'COMPLETED';
    if (activeFilter === 'in-progress') return skill.assessment_status === 'IN_PROGRESS';
    if (activeFilter === 'not-started') return skill.assessment_status === 'NOT_STARTED' || skill.assessment_status === 'PENDING';
    return true;
  });


  const renderSkillCard = (skill: UserSkill, index: number) => {
    const statusColor = getStatusColor(skill.assessment_status);
    const statusIcon = getStatusIcon(skill.assessment_status);
    const statusLabel = getStatusLabel(skill.assessment_status);
    const skillIcon = getSkillIcon(skill.skill.skill_name);
    const completedAssessment = completedAssessments.find(a => a.skillId === skill.skill.id);
    const aiTag = getAITag(skill, completedAssessment);
    const score = skill.current_score || completedAssessment?.finalScore;
    const scoreColor = score ? getScoreColor(score) : '#6B7280';
    const levelLabel = score ? getLevelLabel(score) : 'Not Assessed';

    return (
      <MotiView
        key={skill.id}
        from={{ opacity: 0, translateY: 50, scale: 0.9 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ 
          type: 'spring', 
          delay: index * 100,
          damping: 15,
          stiffness: 100
        }}
        style={{ marginBottom: 16 }}
      >
        <TouchableOpacity
          onPress={() => {
            if (skill.assessment_status === 'COMPLETED') {
              // Navigate to results if completed
              const assessment = completedAssessments.find(a => a.skillId === skill.skill.id);
              if (assessment) {
                router.push({
                  pathname: '/assessment-results',
                  params: { assessmentId: assessment.id }
                });
              }
            } else {
              // Navigate to assessment intro
              router.push({
                pathname: '/assessment-intro',
                params: { skillId: skill.skill.id }
              });
            }
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
              borderWidth: 1,
              borderColor: '#E5E7EB'
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: BRAND + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <AntDesign name={skillIcon} size={24} color={BRAND} />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#1F2937',
                  marginBottom: 4
                }}>
                  {skill.skill.skill_name}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#6B7280',
                  marginBottom: 4
                }}>
                  {skill.skill.category}
                </Text>
              </View>

              {/* Status Badge */}
              <View style={{
                backgroundColor: statusColor + '20',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <AntDesign name={statusIcon} size={14} color={statusColor} style={{ marginRight: 4 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: statusColor
                }}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* AI Tag */}
            <View style={{ marginBottom: 16 }}>
              <View style={{
                backgroundColor: '#F0F9FF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: BRAND + '30'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AntDesign name="robot1" size={16} color={BRAND} style={{ marginRight: 8 }} />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: BRAND
                  }}>
                    AI Tag: {aiTag}
                  </Text>
                </View>
              </View>
            </View>

            {/* Score and Progress */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {score ? (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 12,
                      color: '#6B7280',
                      marginBottom: 4
                    }}>
                      Current Score
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{
                        fontSize: 24,
                        fontWeight: '700',
                        color: scoreColor,
                        marginRight: 8
                      }}>
                        {Math.round(score)}%
                      </Text>
                      <View style={{
                        backgroundColor: scoreColor + '20',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: scoreColor
                        }}>
                          {levelLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress Circle */}
                  <View style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    borderWidth: 4,
                    borderColor: '#E5E7EB',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative'
                  }}>
                    <View style={{
                      position: 'absolute',
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 4,
                      borderColor: 'transparent',
                      borderTopColor: scoreColor,
                      borderRightColor: score >= 25 ? scoreColor : 'transparent',
                      borderBottomColor: score >= 50 ? scoreColor : 'transparent',
                      borderLeftColor: score >= 75 ? scoreColor : 'transparent',
                      transform: [{ rotate: '-90deg' }]
                    }} />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: scoreColor
                    }}>
                      {Math.round(score)}%
                    </Text>
                  </View>
                </>
              ) : (
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 16,
                    color: '#6B7280',
                    fontStyle: 'italic'
                  }}>
                    No assessment completed yet
                  </Text>
                </View>
              )}
            </View>

            {/* Assessment Count */}
            {skill.assessment_count && skill.assessment_count > 0 && (
              <View style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: '#E5E7EB',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#6B7280'
                }}>
                  Assessments taken: {skill.assessment_count}
                </Text>
                {skill.last_assessed_at && (
                  <Text style={{
                    fontSize: 12,
                    color: '#6B7280'
                  }}>
                    Last: {new Date(skill.last_assessed_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    );
  };

  const renderFilterButton = (filter: string, label: string, icon: string) => (
    <TouchableOpacity
      onPress={() => setActiveFilter(filter as any)}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: activeFilter === filter ? BRAND : '#F3F4F6',
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}
    >
      <AntDesign 
        name={icon} 
        size={16} 
        color={activeFilter === filter ? '#FFFFFF' : '#6B7280'} 
        style={{ marginRight: 6 }}
      />
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: activeFilter === filter ? '#FFFFFF' : '#6B7280'
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: BRAND + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <AntDesign name="loading1" size={40} color={BRAND} />
            </View>
          </MotiView>
          <Text style={{ fontSize: 18, color: BRAND, fontWeight: '600' }}>
            Loading Your Activity
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
            Gathering your skill assessments and progress
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" />
      {console.log('🎯 MyActivity render started')}
      
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB'
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#F3F4F6',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <AntDesign name="arrowleft" size={20} color="#374151" />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937' }}>
              My Activity
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>
              Track your skill development journey
            </Text>
          </View>
        </View>

        {/* Filter Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {renderFilterButton('all', 'All Skills', 'appstore-o')}
          {renderFilterButton('completed', 'Completed', 'check-circle')}
          {renderFilterButton('in-progress', 'In Progress', 'clock-circle')}
          {renderFilterButton('not-started', 'Not Started', 'minus-circle')}
        </ScrollView>
      </MotiView>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND]}
            tintColor={BRAND}
          />
        }
      >
        {filteredSkills.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 200 }}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 60
            }}
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#F3F4F6',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <AntDesign name="inbox" size={40} color="#9CA3AF" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              No skills found
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
              {activeFilter === 'all' 
                ? 'You haven\'t selected any skills yet'
                : `No ${activeFilter.replace('-', ' ')} skills found`
              }
            </Text>
            {activeFilter === 'all' && (
              <TouchableOpacity
                onPress={() => router.push('/auth/skills')}
                style={{
                  backgroundColor: BRAND,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Select Skills
                </Text>
              </TouchableOpacity>
            )}
          </MotiView>
        ) : (
          <>
            {/* Stats Summary */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 100 }}
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: '#E5E7EB'
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                📊 Activity Summary
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: BRAND }}>
                    {userSkills.length}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Total Skills</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#10B981' }}>
                    {userSkills.filter(s => s.assessment_status === 'COMPLETED').length}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Completed</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#F59E0B' }}>
                    {userSkills.filter(s => s.assessment_status === 'IN_PROGRESS').length}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>In Progress</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#6B7280' }}>
                    {userSkills.filter(s => s.assessment_status === 'NOT_STARTED' || s.assessment_status === 'PENDING').length}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Pending</Text>
                </View>
              </View>
            </MotiView>

            {/* Skill Cards */}
            {filteredSkills.map((skill, index) => renderSkillCard(skill, index))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


