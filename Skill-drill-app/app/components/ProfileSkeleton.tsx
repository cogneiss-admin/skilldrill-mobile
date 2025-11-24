import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import SkeletonLine from './SkeletonLine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ 
        paddingVertical: 16, 
        paddingHorizontal: SCREEN_WIDTH * 0.06, 
        borderBottomWidth: 1.5, 
        borderBottomColor: '#D1D5DB', 
        marginHorizontal: -(SCREEN_WIDTH * 0.06), 
        backgroundColor: '#FFFFFF', 
        flexDirection: 'row', 
        alignItems: 'center' 
      }}>
        <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: '#E5E7EB' }} />
        <SkeletonLine width={120} height={20} radius={6} style={{ flex: 1, marginLeft: 12, marginRight: 20 }} />
      </View>

      {/* Body */}
      <View style={{ flex: 1, backgroundColor: '#F3F4F6', marginHorizontal: -(SCREEN_WIDTH * 0.06), paddingHorizontal: SCREEN_WIDTH * 0.06 }}>
        <ScrollView contentContainerStyle={{ paddingTop: 0, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginTop: 22,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 }
          }}>
            {/* Avatar */}
            <View style={{ alignItems: 'center', marginTop: -40, marginBottom: 8 }}>
              <View style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: '#E5E7EB',
                borderWidth: 2,
                borderColor: '#E5E7EB'
              }} />
            </View>

            {/* Name */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <SkeletonLine width={60} height={14} radius={6} style={{ marginBottom: 8 }} />
              <View style={{
                backgroundColor: '#f8f9fa',
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                justifyContent: 'center',
                paddingHorizontal: 14
              }}>
                <SkeletonLine width={'70%'} height={16} radius={6} />
              </View>
            </View>

            {/* Phone */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <SkeletonLine width={50} height={14} radius={6} style={{ marginBottom: 8 }} />
              <View style={{
                backgroundColor: '#f8f9fa',
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                justifyContent: 'center',
                paddingHorizontal: 14
              }}>
                <SkeletonLine width={'65%'} height={16} radius={6} />
              </View>
            </View>

            {/* Email */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <SkeletonLine width={45} height={14} radius={6} style={{ marginBottom: 8 }} />
              <View style={{
                backgroundColor: '#f8f9fa',
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                justifyContent: 'center',
                paddingHorizontal: 14
              }}>
                <SkeletonLine width={'75%'} height={16} radius={6} />
              </View>
            </View>

            {/* Career Level */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <SkeletonLine width={100} height={14} radius={6} style={{ marginBottom: 8 }} />
              <View style={{
                backgroundColor: '#f8f9fa',
                height: 56,
                borderWidth: 1,
                borderColor: '#e9ecef',
                borderRadius: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <SkeletonLine width={'60%'} height={16} radius={6} />
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#E5E7EB' }} />
              </View>
              <SkeletonLine width={'95%'} height={12} radius={6} style={{ marginTop: 6 }} />
            </View>

            {/* Career Role */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <SkeletonLine width={90} height={14} radius={6} style={{ marginBottom: 8 }} />
              <View style={{
                backgroundColor: '#f8f9fa',
                height: 56,
                borderWidth: 1,
                borderColor: '#e9ecef',
                borderRadius: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <SkeletonLine width={'55%'} height={16} radius={6} />
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#E5E7EB' }} />
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <View style={{ width: '100%', marginTop: 8, marginBottom: 0 }}>
            <View style={{
              backgroundColor: '#b23b3b',
              borderRadius: 12,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.9
            }}>
              <SkeletonLine width={80} height={16} radius={6} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Footer */}
        <View style={{ 
          position: 'absolute', 
          left: 0, 
          right: 0, 
          bottom: 0, 
          paddingHorizontal: SCREEN_WIDTH * 0.06, 
          paddingTop: 12, 
          paddingBottom: 12, 
          zIndex: 1000, 
          backgroundColor: '#FFFFFF', 
          borderTopWidth: 1, 
          borderTopColor: '#D1D5DB' 
        }}>
          <View style={{ 
            backgroundColor: '#E5E7EB', 
            borderRadius: 22, 
            alignItems: 'center', 
            justifyContent: 'center', 
            paddingVertical: 12, 
            marginHorizontal: 6 
          }}>
            <SkeletonLine width={120} height={16} radius={6} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProfileSkeleton;

