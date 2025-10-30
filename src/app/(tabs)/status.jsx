import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Image,
  Folder,
  Play,
  Download,
  RefreshCw,
  FileText,
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeInUp
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { COLORS } from '@/theme/colors';
import { getWhatsAppStatuses, saveStatusToGallery, requestStoragePermissions, checkWhatsAppDirectory } from '@/utils/whatsappStatus';
import { Video } from 'expo-av';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2; // 2 columns with padding

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [hasDirAccess, setHasDirAccess] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Removed refresh animation to avoid potential reanimated freezes

  // Dados de exemplo para fallback caso não consiga acessar os status reais
  const fallbackStatuses = [
    {
      id: '1',
      type: 'image',
      thumbnail: 'https://picsum.photos/300/300?random=1',
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      size: '2.1 MB',
    },
    {
      id: '2',
      type: 'video',
      thumbnail: 'https://picsum.photos/300/300?random=2',
      timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
      size: '5.3 MB',
      duration: '0:15',
    },
    {
      id: '3',
      type: 'image',
      thumbnail: 'https://picsum.photos/300/300?random=3',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      size: '1.8 MB',
    },
    {
      id: '4',
      type: 'video',
      thumbnail: 'https://picsum.photos/300/300?random=4',
      timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
      size: '8.1 MB',
      duration: '0:23',
    },
    {
      id: '5',
      type: 'image',
      thumbnail: 'https://picsum.photos/300/300?random=5',
      timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
      size: '3.2 MB',
    },
    {
      id: '6',
      type: 'video',
      thumbnail: 'https://picsum.photos/300/300?random=6',
      timestamp: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
      size: '12.4 MB',
      duration: '0:42',
    },
  ];

  const scanStatuses = async () => {
    setIsLoading(true);
    try {
      // Solicita permissões primeiro
      const hasPermission = await requestStoragePermissions();
      if (!hasPermission) {
        setStatuses(fallbackStatuses); // Usa dados de fallback se não tiver permissão
        setLastScanned(new Date());
        return;
      }
      
      // Obtém os status do WhatsApp
      const whatsappStatuses = await getWhatsAppStatuses();
      
      if (whatsappStatuses.length > 0) {
        setStatuses(whatsappStatuses);
        setHasDirAccess(true);
      } else {
        // Se não encontrou status reais, usa os dados de fallback
        setStatuses(fallbackStatuses);
      }
      
      setLastScanned(new Date());
    } catch (error) {
      console.error('Erro ao escanear status:', error);
      Alert.alert('Erro', 'Falha ao escanear status do WhatsApp. Verifique se o WhatsApp está instalado e as permissões foram concedidas.');
      setStatuses(fallbackStatuses); // Usa dados de fallback em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  // Preview helpers
  const currentItem = statuses.length ? statuses[Math.max(0, Math.min(currentIndex, statuses.length - 1))] : null;
  const isCurrentVideo = currentItem?.type === 'video';
  const canPlayVideo = isCurrentVideo && typeof currentItem?.uri === 'string' && currentItem.uri.startsWith('file://');

  // Auto-advance images every 5s (like WhatsApp) only when preview is open and current is image
  useEffect(() => {
    if (!isPreviewOpen || !currentItem || isCurrentVideo) return;
    const id = setTimeout(() => {
      setCurrentIndex((i) => (statuses.length ? (i + 1) % statuses.length : 0));
    }, 5000);
    return () => clearTimeout(id);
  }, [isPreviewOpen, currentItem, isCurrentVideo, statuses.length]);

  useEffect(() => {
    scanStatuses();
  }, []);

  // Fallback: prevent indefinite loading in case something goes wrong
  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const statusDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now - statusDate) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days}d ago`;
    }
  };

  const handleDownloadStatus = async (status) => {
    Alert.alert(
      'Baixar Status', 
      `Deseja baixar este ${status.type === 'video' ? 'vídeo' : 'imagem'}?`, 
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Baixar', 
          onPress: async () => {
            try {
              setDownloadingId(status.id);
              const success = await saveStatusToGallery(status);
              
              if (success) {
                Alert.alert('Sucesso', `${status.type === 'video' ? 'Vídeo' : 'Imagem'} salvo na galeria!`);
              } else {
                Alert.alert('Erro', 'Não foi possível salvar o arquivo. Verifique as permissões.');
              }
            } catch (error) {
              console.error('Erro ao baixar status:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao baixar o status.');
            } finally {
              setDownloadingId(null);
            }
          }
        }
      ]
    );
  };

  const StatusItem = ({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 100)}
      style={{
        width: ITEM_WIDTH,
        marginBottom: 16,
        marginHorizontal: 8,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          setCurrentIndex(index);
          setIsPreviewOpen(true);
        }}
        activeOpacity={0.9}
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#333',
        }}
      >
        {/* Thumbnail */}
        <View style={{ position: 'relative' }}>
          <ExpoImage
            source={{ uri: item.thumbnail }}
            style={{ 
              width: '100%', 
              height: ITEM_WIDTH,
            }}
            contentFit="cover"
            transition={200}
          />
          
          {/* Overlay */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }} />
          
          {/* Type indicator */}
          <View style={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: item.type === 'video' ? COLORS.danger : COLORS.success,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            {item.type === 'video' ? (
              <Play size={12} color="#fff" />
            ) : (
              <Camera size={12} color="#fff" />
            )}
            <Text style={{
              color: '#fff',
              fontSize: 10,
              fontWeight: '600',
              marginLeft: 4,
            }}>
              {item.type.toUpperCase()}
            </Text>
          </View>

          {/* Duration for videos */}
          {item.type === 'video' && item.duration && (
            <View style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: 8,
              paddingHorizontal: 6,
              paddingVertical: 3,
            }}>
              <Text style={{
                color: '#fff',
                fontSize: 11,
                fontWeight: '500',
              }}>
                {item.duration}
              </Text>
            </View>
          )}

          {/* Download icon */}
          <View style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            backgroundColor: COLORS.accent,
            borderRadius: 16,
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {downloadingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Download size={16} color="#fff" />
            )}
          </View>
        </View>

        {/* Info */}
        <View style={{ padding: 12 }}>
          <Text style={{
            color: '#fff',
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 4,
          }}>
            {formatTimestamp(item.timestamp)}
          </Text>
          <Text style={{
            color: '#666',
            fontSize: 11,
          }}>
            {item.size}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const EmptyState = () => (
    <Animated.View 
      entering={FadeIn.delay(300)}
      style={{
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
      }}
    >
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        <FileText size={32} color="#666" />
      </View>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        {t('status.emptyTitle')}
      </Text>
      <Text style={{
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
      }}>
        {t('status.emptyText')}
      </Text>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        data={statuses}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item, index }) => <StatusItem item={item} index={index} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        columnWrapperStyle={{ paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
        bounces={Platform.OS === "android"}
        overScrollMode={Platform.OS === "android" ? "always" : "auto"}
        ListHeaderComponent={(statuses.length > 0 || isLoading || !hasDirAccess) ? (
          <React.Fragment>
            {/* Header Section */}
            <Animated.View 
              entering={FadeIn.delay(200)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: 8,
                }}>
                  {t('status.headerTitle')}
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: '#666',
                  lineHeight: 22,
                }}>
                  {t('status.headerSubtitle')}
                </Text>
                {lastScanned && (
                  <Text style={{
                    fontSize: 12,
                    color: '#444',
                    marginTop: 4,
                  }}>
                    {t('status.lastScanned', { time: lastScanned.toLocaleTimeString() })}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={scanStatuses}
                disabled={isLoading}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#1a1a1a',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isLoading ? 0.7 : 1,
                }}
                activeOpacity={0.7}
              >
                <RefreshCw size={20} color={COLORS.accent} />
              </TouchableOpacity>
            </Animated.View>

            {/* Permission/Access Helper */}
            {!hasDirAccess && (
              <Animated.View
                entering={FadeInUp.delay(250)}
                style={{ paddingHorizontal: 20, marginBottom: 16 }}
              >
                <View
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: 12,
                    padding: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: COLORS.accent,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                    {t('status.accessTitle')}
                  </Text>
                  <Text style={{ color: '#999', fontSize: 13, lineHeight: 18, marginBottom: 12 }}>
                    {t('status.accessText')}
                  </Text>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const ok = await checkWhatsAppDirectory();
                        if (ok) {
                          setHasDirAccess(true);
                          await scanStatuses();
                        }
                      } catch {}
                    }}
                    style={{
                      backgroundColor: COLORS.accent,
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                      {t('status.accessButton')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            
            {/* Stats Section */}
            <Animated.View 
              entering={FadeInUp.delay(300)}
              style={{
                paddingHorizontal: 20,
                marginBottom: 24,
              }}
            >
              <View style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: '#333',
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <Folder color={COLORS.accent} size={20} />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#fff',
                    marginLeft: 12,
                  }}>
                    {t('status.statsFolder')}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 20,
                }}>
                  {t('status.statsFound', { count: statuses.length })}
                </Text>
              </View>
          </Animated.View>
          </React.Fragment>
        ) : null}
      ListEmptyComponent={!isLoading ? <EmptyState /> : null}
    />

    {/* Fullscreen Preview Modal */}
    <Modal
      visible={isPreviewOpen}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => setIsPreviewOpen(false)}
    >
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Top bar */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setIsPreviewOpen(false)} style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10 }}>
            <X size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#aaa', fontSize: 12 }}>{currentIndex + 1} / {statuses.length}</Text>
        </View>

        {/* Media area */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: '100%', aspectRatio: 9/16, backgroundColor: '#000' }}>
            {canPlayVideo ? (
              <Video
                source={{ uri: currentItem?.uri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                shouldPlay
                isLooping={false}
                useNativeControls
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && status.didJustFinish) {
                    setCurrentIndex((i) => (i + 1) % statuses.length);
                  }
                }}
              />
            ) : (
              <ExpoImage
                source={{ uri: currentItem?.thumbnail }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                transition={200}
              />
            )}
          </View>
        </View>

        {/* Bottom controls */}
        <View style={{ paddingBottom: insets.bottom + 12, paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setCurrentIndex((i) => (i - 1 + statuses.length) % statuses.length)}
              style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#111', borderRadius: 10 }}
              activeOpacity={0.85}
            >
              <ChevronLeft size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDownloadStatus(currentItem)}
              style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.accent, borderRadius: 10 }}
              activeOpacity={0.9}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t('status.download')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentIndex((i) => (i + 1) % statuses.length)}
              style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#111', borderRadius: 10 }}
              activeOpacity={0.85}
            >
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </View>
);}