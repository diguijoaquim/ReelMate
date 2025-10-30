import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/theme/colors';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

const LANG_KEY = 'app_language';
const LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [lang, setLang] = React.useState('pt');
  const [saving, setSaving] = React.useState(false);
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANG_KEY);
        if (stored) setLang(stored);
      } catch {}
    })();
  }, []);

  const selectLanguage = async (code) => {
    try {
      setSaving(true);
      setLang(code);
      await AsyncStorage.setItem(LANG_KEY, code);
      await i18n.changeLanguage(code);
    } catch {} finally {
      setSaving(false);
    }
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

        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>
          {t('settings.title')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 }}>
            {t('settings.languageTitle')}
          </Text>
          <Text style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>
            {t('settings.languageHelp')}
          </Text>

          {LANGUAGES.map((item) => {
            const selected = item.code === lang;
            return (
              <TouchableOpacity
                key={item.code}
                onPress={() => selectLanguage(item.code)}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: selected ? COLORS.accent : '#333',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  opacity: saving ? 0.8 : 1,
                }}
                activeOpacity={0.8}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>{item.label}</Text>
                {selected ? <CheckCircle color={COLORS.accent} size={18} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
