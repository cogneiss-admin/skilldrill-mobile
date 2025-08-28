// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND = "#0A66C2";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActivitySkillCardProps {
  id: string;
  skillName: string;
  assessmentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
  aiInsights: string;
  aiTag: string;
  score?: number;
  index: number;
  showResume?: boolean;
  onResume?: () => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED': return '#10B981';
    case 'IN_PROGRESS': return '#F59E0B';
    case 'NOT_STARTED': return '#6B7280';
    case 'PENDING': return '#8B5CF6';
    default: return '#6B7280';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'COMPLETED': return 'Completed';
    case 'IN_PROGRESS': return 'In Progress';
    case 'NOT_STARTED': return 'Not Started';
    case 'PENDING': return 'Pending';
    default: return 'Unknown';
  }
};

export const ActivitySkillCard: React.FC<ActivitySkillCardProps> = ({
  id,
  skillName,
  assessmentStatus,
  aiInsights,
  aiTag,
  score,
  index,
  showResume,
  onResume
}) => {
  const statusColor = getStatusColor(assessmentStatus);
  const statusLabel = getStatusLabel(assessmentStatus);

  const base = Math.min(1, SCREEN_WIDTH / 390);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 40, scale: 0.97 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', delay: index * 80, damping: 16, stiffness: 110 }}
      style={{ marginBottom: 12 }}
    >
      <View style={{
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
        marginHorizontal: 4
      }}>
        <LinearGradient colors={[BRAND, '#0056B3']} style={{ padding: 14 * base, paddingBottom: 12 * base }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                flex: 1,
                paddingRight: 10 * base,
                fontSize: 18 * base,
                lineHeight: 22 * base,
                fontWeight: '800',
                color: '#FFFFFF',
                flexWrap: 'wrap'
              }}
              numberOfLines={2}
            >
              {skillName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
              <View style={{ width: 10 * base, height: 10 * base, borderRadius: 5 * base, backgroundColor: statusColor, marginRight: 6 * base }} />
              <Text style={{ fontSize: 13 * base, color: '#FFFFFF', fontWeight: '600' }} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 14 * base }}>
          <Text style={{ fontSize: 14 * base, fontWeight: '700', color: '#1F2937', marginBottom: 6 * base }}>Feedback</Text>
          {!!aiInsights && (
            <Text style={{ fontSize: 13 * base, color: '#374151', lineHeight: 18 * base, marginBottom: 12 * base }} numberOfLines={3}>
              {aiInsights}
            </Text>
          )}

          {/* Row for chips: AI tag (left) and View Details (right) */}
          <View style={{ width: '100%', marginTop: 4 * base, marginBottom: 10 * base, flexDirection: 'row', alignItems: 'center' }}>
            {!!aiTag && (
              <View style={{
                backgroundColor: '#FEF3C7',
                paddingHorizontal: 12 * base,
                paddingVertical: 8 * base,
                borderRadius: 18 * base,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#FDE68A'
              }}>
                <Text style={{ fontSize: 12 * base, fontWeight: '700', color: '#92400E' }}>{aiTag}</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            {assessmentStatus === 'COMPLETED' && (
              <TouchableOpacity activeOpacity={0.85} style={{
                backgroundColor: '#F3F4F6',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                paddingHorizontal: 10 * base,
                paddingVertical: 6 * base,
                borderRadius: 999
              }}>
                <Text style={{ fontSize: 11 * base, fontWeight: '700', color: '#374151' }}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>

          {(showResume && (assessmentStatus === 'PENDING' || assessmentStatus === 'IN_PROGRESS')) && (
            <TouchableOpacity onPress={onResume} style={{
              marginTop: 6 * base,
              backgroundColor: BRAND,
              paddingVertical: 10 * base,
              borderRadius: 10 * base,
              alignItems: 'center'
            }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 * base }}>Resume Assessment</Text>
            </TouchableOpacity>
          )}

          {typeof score === 'number' && assessmentStatus === 'COMPLETED' && (
            <View style={{ paddingTop: 10 * base, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12 * base, color: '#6B7280', fontWeight: '500' }}>Final Score</Text>
              <Text style={{ fontSize: 18 * base, fontWeight: '800', color: BRAND }}>{(Math.round((score + Number.EPSILON) * 10) / 10).toFixed(1)}/10</Text>
            </View>
          )}
        </View>
      </View>
    </MotiView>
  );
};

export default ActivitySkillCard;
