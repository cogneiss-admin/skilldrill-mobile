import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  // Determine active tab based on current route if not provided
  const currentActiveTab = activeTab || (() => {
    if (pathname === '/dashboard' || pathname === '/') return 'home';
    if (pathname === '/activity') return 'activity';
    if (pathname === '/discover') return 'discover';
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
      case 'discover':
        router.replace('/discover');
        break;
      case 'profile':
        router.replace('/profile');
        break;
    }
  };

  return (
    <View style={[styles.bottomNavigation, { paddingBottom: insets.bottom > 0 ? insets.bottom : 4 }]}>
      <View style={styles.bottomNavRow}>
        {/* Home Tab */}
        <TouchableOpacity onPress={() => handleTabPress('home')} style={styles.navButton} activeOpacity={0.85}>
          <AntDesign name="home" size={22} color={currentActiveTab === 'home' ? BRAND : GRAY} />
          <Text style={[TYPOGRAPHY.labelSmall, currentActiveTab === 'home' ? styles.tabLabelActive : styles.tabLabelInactive]}>Home</Text>
        </TouchableOpacity>

        {/* Discover Tab */}
        <TouchableOpacity onPress={() => handleTabPress('discover')} style={styles.navButton} activeOpacity={0.85}>
          <Ionicons name="compass" size={22} color={currentActiveTab === 'discover' ? BRAND : GRAY} />
          <Text style={[TYPOGRAPHY.labelSmall, currentActiveTab === 'discover' ? styles.tabLabelActive : styles.tabLabelInactive]}>Discover</Text>
        </TouchableOpacity>

        {/* Activity Tab */}
        <TouchableOpacity onPress={() => handleTabPress('activity')} style={styles.navButton} activeOpacity={0.85}>
          <Ionicons name="time-outline" size={22} color={currentActiveTab === 'activity' ? BRAND : GRAY} />
          <Text style={[TYPOGRAPHY.labelSmall, currentActiveTab === 'activity' ? styles.tabLabelActive : styles.tabLabelInactive]}>Activity</Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity onPress={() => handleTabPress('profile')} style={styles.navButton} activeOpacity={0.85}>
          <Ionicons name="person-outline" size={22} color={currentActiveTab === 'profile' ? BRAND : GRAY} />
          <Text style={[TYPOGRAPHY.labelSmall, currentActiveTab === 'profile' ? styles.tabLabelActive : styles.tabLabelInactive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#D1D5DB',
    paddingBottom: 4,
    paddingTop: 12,
    paddingHorizontal: width * 0.06,
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
    minHeight: 48,
  },
  tabLabelInactive: { color: GRAY, marginTop: 4, fontWeight: '500' },
  tabLabelActive: { color: BRAND, marginTop: 4, fontWeight: '700' },
});

export default BottomNavigation;
