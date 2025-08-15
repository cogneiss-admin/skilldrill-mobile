// @ts-nocheck
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useResponsive } from '../utils/responsive';

/**
 * Example component demonstrating responsive design patterns
 * This shows how to use the responsive utility functions
 */
export default function ResponsiveExample() {
  const responsive = useResponsive();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView 
        contentContainerStyle={{
          padding: responsive.padding.lg,
          maxWidth: responsive.maxWidth.card,
          alignSelf: 'center',
          width: '100%'
        }}
      >
        {/* Responsive Header */}
        <Text style={{
          fontSize: responsive.typography.h1,
          fontWeight: '800',
          color: '#0A66C2',
          textAlign: 'center',
          marginBottom: responsive.spacing(24)
        }}>
          Responsive Design Demo
        </Text>

        {/* Device Info Card */}
        <View style={{
          ...responsive.card,
          backgroundColor: responsive.isPhone ? '#f0f9ff' : responsive.isTablet ? '#f0fdf4' : '#fefce8',
          borderWidth: 1,
          borderColor: responsive.isPhone ? '#0ea5e9' : responsive.isTablet ? '#22c55e' : '#eab308'
        }}>
          <Text style={{
            fontSize: responsive.typography.h4,
            fontWeight: '700',
            marginBottom: responsive.spacing(12),
            color: responsive.isPhone ? '#0c4a6e' : responsive.isTablet ? '#166534' : '#854d0e'
          }}>
            Device Information
          </Text>
          
          <Text style={{ fontSize: responsive.typography.body1, marginBottom: responsive.spacing(8) }}>
            Device Type: {responsive.deviceType}
          </Text>
          <Text style={{ fontSize: responsive.typography.body1, marginBottom: responsive.spacing(8) }}>
            Screen Size: {responsive.screenWidth} × {responsive.screenHeight}
          </Text>
          <Text style={{ fontSize: responsive.typography.body1, marginBottom: responsive.spacing(8) }}>
            Orientation: {responsive.isLandscape ? 'Landscape' : 'Portrait'}
          </Text>
          <Text style={{ fontSize: responsive.typography.body1 }}>
            Layout Columns: {responsive.layout.columns}
          </Text>
        </View>

        {/* Typography Scale */}
        <View style={{ marginTop: responsive.spacing(24) }}>
          <Text style={{
            fontSize: responsive.typography.h3,
            fontWeight: '700',
            marginBottom: responsive.spacing(16)
          }}>
            Typography Scale
          </Text>
          
          <Text style={{ fontSize: responsive.typography.h1, marginBottom: responsive.spacing(8) }}>
            H1 Heading ({responsive.typography.h1}px)
          </Text>
          <Text style={{ fontSize: responsive.typography.h2, marginBottom: responsive.spacing(8) }}>
            H2 Heading ({responsive.typography.h2}px)
          </Text>
          <Text style={{ fontSize: responsive.typography.h3, marginBottom: responsive.spacing(8) }}>
            H3 Heading ({responsive.typography.h3}px)
          </Text>
          <Text style={{ fontSize: responsive.typography.body1, marginBottom: responsive.spacing(8) }}>
            Body 1 Text ({responsive.typography.body1}px)
          </Text>
          <Text style={{ fontSize: responsive.typography.body2, marginBottom: responsive.spacing(8) }}>
            Body 2 Text ({responsive.typography.body2}px)
          </Text>
          <Text style={{ fontSize: responsive.typography.caption }}>
            Caption Text ({responsive.typography.caption}px)
          </Text>
        </View>

        {/* Spacing Demo */}
        <View style={{ marginTop: responsive.spacing(24) }}>
          <Text style={{
            fontSize: responsive.typography.h3,
            fontWeight: '700',
            marginBottom: responsive.spacing(16)
          }}>
            Responsive Spacing
          </Text>
          
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: responsive.spacing(8)
          }}>
            {['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].map((size) => (
              <View
                key={size}
                style={{
                  padding: responsive.padding[size],
                  backgroundColor: '#e5e7eb',
                  borderRadius: responsive.size(8),
                  marginBottom: responsive.spacing(8)
                }}
              >
                <Text style={{ fontSize: responsive.typography.caption }}>
                  {size}: {responsive.padding[size]}px
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Responsive Button */}
        <View style={{ marginTop: responsive.spacing(32) }}>
          <Button
            mode="contained"
            style={{
              borderRadius: responsive.button.borderRadius,
              backgroundColor: '#0A66C2'
            }}
            contentStyle={{
              height: responsive.button.height,
              paddingHorizontal: responsive.button.paddingHorizontal
            }}
            labelStyle={{
              fontSize: responsive.button.fontSize,
              fontWeight: '700'
            }}
          >
            Responsive Button
          </Button>
        </View>

        {/* Layout Grid Demo */}
        <View style={{ marginTop: responsive.spacing(24) }}>
          <Text style={{
            fontSize: responsive.typography.h3,
            fontWeight: '700',
            marginBottom: responsive.spacing(16)
          }}>
            Layout Grid ({responsive.layout.columns} columns)
          </Text>
          
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: responsive.layout.itemSpacing
          }}>
            {Array.from({ length: 6 }, (_, i) => (
              <View
                key={i}
                style={{
                  flex: responsive.layout.columns === 1 ? 1 : 0,
                  width: responsive.layout.columns === 1 ? '100%' : 
                         responsive.layout.columns === 2 ? `${(100 - 2) / 2}%` :
                         responsive.layout.columns === 3 ? `${(100 - 4) / 3}%` :
                         `${(100 - 6) / 4}%`,
                  height: responsive.size(80),
                  backgroundColor: '#f3f4f6',
                  borderRadius: responsive.size(8),
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: responsive.typography.body2 }}>
                  Item {i + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: responsive.spacing(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Usage Examples:
 * 
 * 1. Basic responsive text:
 *    <Text style={{ fontSize: responsive.typography.h1 }}>Title</Text>
 * 
 * 2. Responsive spacing:
 *    <View style={{ padding: responsive.padding.lg, margin: responsive.margin.md }} />
 * 
 * 3. Responsive sizing:
 *    <Image style={{ width: responsive.size(100), height: responsive.size(100) }} />
 * 
 * 4. Device-specific styles:
 *    backgroundColor: responsive.isPhone ? '#blue' : '#green'
 * 
 * 5. Container with max width:
 *    <View style={{ maxWidth: responsive.maxWidth.form, alignSelf: 'center' }} />
 * 
 * 6. Responsive button:
 *    <Button style={{ borderRadius: responsive.button.borderRadius }} />
 */
