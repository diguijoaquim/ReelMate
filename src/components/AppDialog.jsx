import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '@/theme/colors';

export default function AppDialog({ visible, title, message, onClose, confirmLabel = 'OK' }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 420, backgroundColor: '#0c0c0c', borderRadius: 16, borderWidth: 1, borderColor: '#222' }}>
          <View style={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 }}>
            {!!title && (
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{title}</Text>
            )}
          </View>
          <View style={{ paddingHorizontal: 18, paddingVertical: 8 }}>
            <Text style={{ color: '#b3b3b3', fontSize: 14, lineHeight: 20 }}>{message}</Text>
          </View>
          <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={{ backgroundColor: COLORS.accent, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
