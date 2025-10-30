import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/theme/colors';
import { CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

const LANG_KEY = 'app_language';
const LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = React.useState('en');
  const [saving, setSaving] = React.useState(false);
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANG_KEY);
        if (stored) setSelected(stored);
      } catch {}
    })();
  }, []);

  const choose = async (code) => {
    try {
      setSaving(true);
      setSelected(code);
      await AsyncStorage.setItem(LANG_KEY, code);
      await i18n.changeLanguage(code);
      router.replace('/');
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.bg,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 }}>
          {t('settings.languageTitle')}
        </Text>
        <Text style={{ fontSize: 13, color: '#999' }}>{t('settings.languageHelp')}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {LANGUAGES.map((item) => {
          const isSelected = item.code === selected;
          return (
            <TouchableOpacity
              key={item.code}
              onPress={() => choose(item.code)}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: isSelected ? COLORS.accent : '#333',
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
              {isSelected ? <CheckCircle color={COLORS.accent} size={18} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
