import React, { useRef, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const params = useLocalSearchParams();
  const { t } = useTranslation();

  const DEFAULT_PRIVACY_URL = 'https://reelmate-jet.vercel.app/politica';
  const uri = useMemo(() => {
    const p = typeof params?.url === 'string' ? params.url : undefined;
    return p && /^https?:\/\//i.test(p) ? p : DEFAULT_PRIVACY_URL;
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Animated.View
        entering={FadeIn.duration(300)}
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

        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: COLORS.text,
          }}
        >
          {t('drawer.privacy')}
        </Text>
      </Animated.View>

      <View style={{ flex: 1 }}>
        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              backgroundColor: COLORS.bg,
            }}
          >
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        )}

        <WebView
          ref={webviewRef}
          source={{ uri }}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={false}
          allowsBackForwardNavigationGestures
          style={{ flex: 1, backgroundColor: '#fff' }}
        />
      </View>
    </View>
  );
}
