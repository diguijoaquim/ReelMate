import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Settings } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS } from '@/theme/colors';

export default function AppHeader({ onMenuPress }) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View 
      entering={FadeIn.duration(600)}
      style={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
      }}
    >
      <TouchableOpacity
        onPress={onMenuPress}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#1a1a1a',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={0.7}
      >
        <Menu color="#fff" size={20} />
      </TouchableOpacity>

      <View style={{ alignItems: 'center' }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#fff',
          letterSpacing: -0.5,
        }}>
          ReelMate
        </Text>
        <Text style={{
          fontSize: 12,
          color: '#666',
          marginTop: 2,
        }}>
          Video Downloader
        </Text>
      </View>

      <TouchableOpacity
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#1a1a1a',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={0.7}
      >
        <Settings color="#666" size={18} />
      </TouchableOpacity>
    </Animated.View>
  );
}