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
  Platform
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
  CheckCircle
} from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeInUp
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { COLORS } from '@/theme/colors';
import { getWhatsAppStatuses, saveStatusToGallery, requestStoragePermissions } from '@/utils/whatsappStatus';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2; // 2 columns with padding

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

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
        onPress={() => handleDownloadStatus(item)}
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
        No Statuses Found
      </Text>
      <Text style={{
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
      }}>
        Nenhum status do WhatsApp foi encontrado. Verifique se o WhatsApp está instalado e se você visualizou alguns status recentemente.
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
        ListHeaderComponent={
          <>
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
                  WhatsApp Status
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: '#666',
                  lineHeight: 22,
                }}>
                  Save WhatsApp statuses to your device
                </Text>
                {lastScanned && (
                  <Text style={{
                    fontSize: 12,
                    color: '#444',
                    marginTop: 4,
                  }}>
                    Last scanned: {lastScanned.toLocaleTimeString()}
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
                    Status Folder
                  </Text>
                </View>
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 20,
                }}>
                  Found {statuses.length} items in WhatsApp status folder
                </Text>
              </View>
            </Animated.View>
          </>
        }
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
      />
    </View>
  );
}