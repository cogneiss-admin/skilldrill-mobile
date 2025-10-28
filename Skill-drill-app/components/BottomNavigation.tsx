import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { BRAND } from '../app/components/Brand';

// Define constants
const GRAY = "#9CA3AF";

// Typography System
const TYPOGRAPHY = {
  labelSmall: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
};

interface BottomNavigationProps {
  activeTab?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab based on current route if not provided
  const currentActiveTab = activeTab || (() => {
    if (pathname === '/dashboard' || pathname === '/') return 'home';
    if (pathname === '/activity') return 'activity';
    if (pathname === '/profile') return 'profile';
    return 'home';
  })();

  const handleTabPress = (tab: string) => {
    switch (tab) {
      case 'home':
        router.replace('/dashboard');
        break;
      case 'activity':
        router.replace('/activity');
        break;
      case 'profile':
        // TODO: Add profile screen route when created
        console.log('Profile tab pressed');
        break;
    }
  };

  return (
    <View style={styles.bottomNavigation}>
      <View style={styles.bottomNavRow}>
        {/* Home Tab */}
        <TouchableOpacity
          onPress={() => handleTabPress('home')}
          style={styles.navButton}
        >
          <AntDesign
            name="home"
            size={24}
            color={currentActiveTab === 'home' ? BRAND : GRAY}
          />
          <Text style={[
            TYPOGRAPHY.labelSmall,
            {
              color: currentActiveTab === 'home' ? BRAND : GRAY,
              marginTop: 4
            }
          ]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Activity Tab */}
        <TouchableOpacity
          onPress={() => handleTabPress('activity')}
          style={styles.navButton}
        >
          <Ionicons
            name="time-outline"
            size={24}
            color={currentActiveTab === 'activity' ? BRAND : GRAY}
          />
          <Text style={[
            TYPOGRAPHY.labelSmall,
            {
              color: currentActiveTab === 'activity' ? BRAND : GRAY,
              marginTop: 4
            }
          ]}>
            Activity
          </Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity
          onPress={() => handleTabPress('profile')}
          style={styles.navButton}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={currentActiveTab === 'profile' ? BRAND : GRAY}
          />
          <Text style={[
            TYPOGRAPHY.labelSmall,
            {
              color: currentActiveTab === 'profile' ? BRAND : GRAY,
              marginTop: 4
            }
          ]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: 25,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  bottomNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 50,
  },
});

export default BottomNavigation;
