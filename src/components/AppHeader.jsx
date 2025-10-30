import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Heart } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS } from '@/theme/colors';
import AppDialog from '@/components/AppDialog';
import { useTranslation } from 'react-i18next';

export default function AppHeader({ onMenuPress }) {
  const insets = useSafeAreaInsets();
  const [showLoveDialog, setShowLoveDialog] = React.useState(false);
  const { t } = useTranslation();

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
        onPress={() => setShowLoveDialog(true)}
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
        <Heart color={COLORS.accent} size={18} fill={COLORS.accent} />
      </TouchableOpacity>

      <AppDialog
        visible={showLoveDialog}
        title={t('dialogs.loveTitle')}
        message={t('dialogs.loveMessage')}
        onClose={() => setShowLoveDialog(false)}
        confirmLabel={t('actions.close')}
      />
    </Animated.View>
  );
}