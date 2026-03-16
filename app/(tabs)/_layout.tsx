import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#f97316', // Seçili ikon rengi (Turuncu)
        tabBarInactiveTintColor: '#9ca3af', // Pasif ikon rengi (Gri)
        tabBarShowLabel: true, // ✅ BU AYAR YAZILARI AÇAR
        tabBarStyle: {
          position: 'absolute',
          bottom: 32, // Alt kısımdan biraz yukarıda
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        
        tabBarItemStyle: {
           paddingTop: 10, // İkonları biraz aşağı/ortaya hizalar
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4, // İkon ile yazı arasına boşluk
        },

        // Arka plan (Buzlu Cam Efekti)
        tabBarBackground: () => (
          <View style={styles.tabBarBackgroundContainer}>
            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />
            <View style={styles.glassBorder} /> 
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Anasayfa',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "home" : "home-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Şehir Rehberi (Eski explore.tsx) */}
      <Tabs.Screen
        name="explore" 
        options={{
          title: 'Şehir Rehberi',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "compass" : "compass-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />

      {/* işletmeler */}
      <Tabs.Screen
        name="places" 
        options={{
          title: 'İşletmeler',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "menu" : "menu"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30, // Daha yuvarlak köşeler
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.90)', // Biraz daha opak beyaz
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  }
});