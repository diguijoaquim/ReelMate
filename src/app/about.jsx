import React from 'react';
import { View, Text, ScrollView, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { ArrowLeft, Github, Globe, Mail } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const appFeatures = [
    t('about.features.downloadVideos'),
    t('about.features.downloadManagement'),
    t('about.features.intuitiveInterface'),
    t('about.features.videoFormats'),
    t('about.features.easySharing'),
    'Gerenciamento de downloads com histórico completo',
    'Interface intuitiva e moderna',
    'Suporte para múltiplos formatos de vídeo',
    'Compartilhamento fácil para outras plataformas'
  ];

  const teamInfo = {
    name: 'BlueSpark MZ',
    description: 'Equipe de desenvolvimento especializada em aplicativos móveis'
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View 
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: COLORS.bg,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: COLORS.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft color={COLORS.text} size={20} />
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: COLORS.text,
        }}>
          {t('about.title')}
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View 
          style={{
            alignItems: 'center',
            marginBottom: 30,
          }}
        >
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={{ width: 100, height: 100, borderRadius: 50 }}
              resizeMode="contain"
            />
          </View>
          
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: COLORS.text,
            marginBottom: 8,
          }}>
            ReelMate
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: COLORS.textMuted,
            textAlign: 'center',
            marginBottom: 16,
          }}>
            Versão 1.0.0
          </Text>
        </View>

        <View 
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: COLORS.text,
            marginBottom: 12,
          }}>
            {t('about.missionTitle')}
          </Text>
          
          <Text style={{
            fontSize: 15,
            color: COLORS.textMuted,
            lineHeight: 22,
            textAlign: 'center',
          }}>
            {t('about.missionText')}
          </Text>
        </View>

        <View 
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            padding: 20,
            marginBottom: insets.bottom + 20,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: COLORS.text,
            marginBottom: 12,
            textAlign: 'center',
          }}>
            {t('about.teamTitle')}
          </Text>
          <Text style={{
            fontSize: 15,
            color: COLORS.textMuted,
            textAlign: 'center'
          }}>
            {t('about.teamName')}
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#444',
            textAlign: 'center',
            marginTop: 8,
          }}>
            Made with ❤️ by <Text style={{ color: COLORS.accent, fontWeight: '700' }}>BlueSpark MZ</Text>
          </Text>
          <Text style={{
            fontSize: 14,
            color: COLORS.textMuted,
            textAlign: 'center',
            marginTop: 16,
          }}>
            {t('about.rights')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}