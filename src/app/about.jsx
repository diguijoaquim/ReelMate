import React from 'react';
import { View, Text, ScrollView, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/colors';
import { ArrowLeft, Github, Globe, Mail } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  const appFeatures = [
    'Download de vídeos do Instagram, Facebook e TikTok',
    'Gerenciamento de downloads com histórico completo',
    'Interface intuitiva e moderna',
    'Suporte para múltiplos formatos de vídeo',
    'Compartilhamento fácil para outras plataformas'
  ];

  // Informação simplificada sobre a equipe
  const teamInfo = {
    name: 'BlueSpark MZ',
    description: 'Equipe de desenvolvimento especializada em aplicativos móveis'
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
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

        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: COLORS.text,
        }}>
          Sobre Nós
        </Text>
      </Animated.View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={SlideInUp.delay(100).duration(500)}
          style={{
            alignItems: 'center',
            marginBottom: 30,
          }}
        >
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: COLORS.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{
              fontSize: 40,
              fontWeight: 'bold',
              color: COLORS.accent,
            }}>
              RM
            </Text>
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
        </Animated.View>

        <Animated.View 
          entering={SlideInUp.delay(200).duration(500)}
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
            Nossa Missão
          </Text>
          
          <Text style={{
            fontSize: 15,
            color: COLORS.textMuted,
            lineHeight: 22,
          }}>
            O ReelMate foi criado com a missão de simplificar o download e gerenciamento de vídeos das redes sociais. Nosso objetivo é proporcionar uma experiência intuitiva e eficiente para os amantes de conteúdo digital.
          </Text>
        </Animated.View>

        <Animated.View 
          entering={SlideInUp.delay(300).duration(500)}
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
            Recursos Principais
          </Text>
          
          {appFeatures.map((feature, index) => (
            <View 
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: index < appFeatures.length - 1 ? 12 : 0,
              }}
            >
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: COLORS.accent,
                marginRight: 12,
              }} />
              <Text style={{
                fontSize: 14,
                color: COLORS.textMuted,
              }}>
                {feature}
              </Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View 
          entering={SlideInUp.delay(400).duration(500)}
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
            marginBottom: 16,
          }}>
            Nossa Equipe
          </Text>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.text,
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {teamInfo.name}
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: COLORS.textMuted,
              textAlign: 'center'
            }}>
              {teamInfo.description}
            </Text>
          </View>
        </Animated.View>

        <Animated.View 
          entering={SlideInUp.delay(500).duration(500)}
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
            marginBottom: 16,
            textAlign: 'center',
          }}>
            Entre em Contato
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:contato@reelmate.com')}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: COLORS.bg,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 10,
              }}
              activeOpacity={0.7}
            >
              <Mail color={COLORS.accent} size={22} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => Linking.openURL('https://github.com/reelmate')}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: COLORS.bg,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 10,
              }}
              activeOpacity={0.7}
            >
              <Github color={COLORS.accent} size={22} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => Linking.openURL('https://reelmate.com')}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: COLORS.bg,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 10,
              }}
              activeOpacity={0.7}
            >
              <Globe color={COLORS.accent} size={22} />
            </TouchableOpacity>
          </View>
          
          <Text style={{
            fontSize: 14,
            color: COLORS.textMuted,
            textAlign: 'center',
          }}>
            © 2023 ReelMate. Todos os direitos reservados.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}