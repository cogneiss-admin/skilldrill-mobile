import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AssessmentCompletionDialogProps {
  visible: boolean;
  skillName: string;
  onSeeResults: () => void;
  onContinueNext: () => void;
  isLoadingResults?: boolean;
}

export const AssessmentCompletionDialog: React.FC<AssessmentCompletionDialogProps> = ({
  visible,
  skillName,
  onSeeResults,
  onContinueNext,
  isLoadingResults = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent
    >
      {/* Background overlay with blur */}
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(20, 20, 20, 0.4)',
        justifyContent: 'flex-end',
      }}>
        <BlurView intensity={20} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }} />
        
        {/* Dialog content */}
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}>
          {/* Handle bar */}
          <View style={{
            alignItems: 'center',
            paddingBottom: 16,
          }}>
            <View style={{
              width: 40,
              height: 6,
              backgroundColor: '#D1D5DB',
              borderRadius: 3,
            }} />
          </View>

          {/* Content */}
          <View style={{ alignItems: 'center', textAlign: 'center' }}>
            {/* Icon */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#DBEAFE',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="ribbon-outline" size={32} color="#1380EC" />
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 28,
            }}>
              Well done! You completed {skillName} assessment!
            </Text>
          </View>

          {/* Action buttons */}
          <View style={{ gap: 16 }}>
            {/* See Results Now button */}
            <TouchableOpacity
              onPress={onSeeResults}
              disabled={isLoadingResults}
              style={{
                backgroundColor: isLoadingResults ? '#9CA3AF' : '#1380EC',
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#1380EC',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {isLoadingResults && (
                <ActivityIndicator 
                  size="small" 
                  color="white" 
                />
              )}
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
              }}>
                {isLoadingResults ? 'Loading Results...' : 'See Results Now'}
              </Text>
            </TouchableOpacity>

            {/* Continue to Next Assessment button */}
            <TouchableOpacity
              onPress={onContinueNext}
              style={{
                backgroundColor: '#F3F4F6',
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{
                color: '#374151',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Continue to Next Assessment
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AssessmentCompletionDialog;