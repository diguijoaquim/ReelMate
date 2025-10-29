import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { 
  User, 
  Settings, 
  Info, 
  HelpCircle, 
  Star, 
  Share,
  X 
} from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, SlideInLeft } from 'react-native-reanimated';

export default function DrawerMenu({ onClose }) {
  const insets = useSafeAreaInsets();

  const menuItems = [
    { icon: Settings, label: 'Settings', onPress: () => {} },
    { icon: Star, label: 'Rate App', onPress: () => {} },
    { icon: Share, label: 'Share App', onPress: () => {} },
    { icon: HelpCircle, label: 'Help & Support', onPress: () => {} },
    { icon: Info, label: 'About', onPress: () => router.push('/about') },
  ];

  return (
    <Animated.View 
      entering={SlideInLeft.duration(300)}
      style={{
        flex: 1,
        backgroundColor: '#1a1a1a',
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
      }}>
        <View>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 4,
          }}>
            Menu
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#666',
          }}>
            Welcome back!
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#333',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <X color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <ScrollView style={{ flex: 1 }}>
        <View style={{ paddingVertical: 20 }}>
          {menuItems.map((item, index) => (
            <Animated.View
              key={item.label}
              entering={FadeIn.delay(100 + index * 50)}
            >
              <TouchableOpacity
                onPress={() => {
                  item.onPress();
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#333',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <item.icon color={COLORS.accent} size={20} />
                </View>
                <Text style={{
                  fontSize: 16,
                  color: '#fff',
                  fontWeight: '500',
                }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 20,
      }}>
        <Text style={{
          fontSize: 12,
          color: '#666',
          textAlign: 'center',
        }}>
          ReelMate v1.0.0
        </Text>
        <Text style={{
          fontSize: 11,
          color: '#444',
          textAlign: 'center',
          marginTop: 4,
        }}>
          Made with ❤️ for video lovers
        </Text>
      </View>
    </Animated.View>
  );
}