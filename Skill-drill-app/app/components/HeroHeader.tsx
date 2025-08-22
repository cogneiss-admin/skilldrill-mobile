// @ts-nocheck
import React from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const DEFAULT_BRAND = '#0A66C2';
const DEFAULT_APP_NAME = 'Skill Drill';

export function HeroHeader({
  brand = DEFAULT_BRAND,
  appName = DEFAULT_APP_NAME,
  title,
  subtitle,
  detail,
  logo = require('../../assets/images/logo.png'),
}: {
  brand?: string;
  appName?: string;
  title: string;
  subtitle?: string;
  detail?: string;
  logo?: any;
}) {
  return (
    <View style={{ minHeight: 200, position: 'relative' }}>
      <LinearGradient colors={[brand, '#0E75D1', '#1285E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 18, paddingTop: 10 }}>
        <Image source={logo} style={{ width: 56, height: 56, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10 }} resizeMode="contain" />
        <Text style={{ marginLeft: 12, color: '#ffffff', fontSize: 22, fontWeight: '900', letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>{appName}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18, paddingBottom: 20 }}>
        <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 480 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#ffffff' }}>{title}</Text>
          {subtitle ? (
            <Text style={{ marginTop: 8, color: '#E6F2FF', fontSize: 15 }}>{subtitle}</Text>
          ) : null}
          {detail ? (
            <Text style={{ marginTop: 4, color: '#E6F2FF', fontSize: 13, opacity: 0.9 }}>{detail}</Text>
          ) : null}
        </MotiView>
      </View>
    </View>
  );
}

export default HeroHeader;


