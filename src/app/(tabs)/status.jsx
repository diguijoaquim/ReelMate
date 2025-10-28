import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  PermissionsAndroid,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Menu, 
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  HardDrive,
  Shield,
  Clock,
  Download,
  Folder,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [waDirUri, setWaDirUri] = useState(null);
  const [waFiles, setWaFiles] = useState([]);
  const [waLoading, setWaLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [permissions, setPermissions] = useState({
    storage: false,
    loading: true,
  });
  const [connectivity, setConnectivity] = useState({
    isConnected: true,
    type: 'wifi',
  });
  const [systemInfo, setSystemInfo] = useState({
    totalStorage: 1024, // 1GB simulated
    usedStorage: 0,
    recentActivity: [],
  });

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const loadWhatsAppDirFromStorage = async () => {
    try {
      const uri = await AsyncStorage.getItem('reelmate_wa_statuses_uri');
      if (uri) setWaDirUri(uri);
    } catch (e) {
      console.warn('Failed to load WA dir uri', e);
    }
  };

  const requestWhatsAppStatusesAccess = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Apenas Android', 'Os Status do WhatsApp só estão disponíveis no Android.');
      return;
    }
    try {
      setWaLoading(true);
      const FileSystem = await import('expo-file-system');
      const initialUri = 'content://com.android.externalstorage.documents/tree/primary%3AAndroid%2Fmedia%2Fcom.whatsapp%2FWhatsApp%2FMedia%2F.Statuses';
      const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
      if (result.granted) {
        await AsyncStorage.setItem('reelmate_wa_statuses_uri', result.directoryUri);
        setWaDirUri(result.directoryUri);
        await loadWhatsAppStatuses(result.directoryUri);
      } else {
        Alert.alert('Permissão negada', 'Sem acesso à pasta de Status do WhatsApp.');
      }
    } catch (e) {
      console.warn('SAF request error', e);
      Alert.alert('Erro', 'Não foi possível solicitar acesso à pasta.');
    } finally {
      setWaLoading(false);
    }
  };

  const loadWhatsAppStatuses = async (dirUriParam) => {
    if (Platform.OS !== 'android') return;
    const dirUri = dirUriParam || waDirUri;
    if (!dirUri) return;
    try {
      setWaLoading(true);
      const FileSystem = await import('expo-file-system');
      const uris = await FileSystem.StorageAccessFramework.readDirectoryAsync(dirUri);
      const mediaUris = uris.filter((u) => /\.(jpg|jpeg|png|mp4)$/i.test(u));
      // Opcional: ordenar por nome/tempo — muitos URIs incluem timestamp
      mediaUris.sort((a, b) => (a > b ? -1 : 1));
      setWaFiles(mediaUris);
    } catch (e) {
      console.warn('Read WA statuses error', e);
      Alert.alert('Erro', 'Não foi possível ler a pasta de Status. Tente reconectar.');
    } finally {
      setWaLoading(false);
    }
  };

  const openViewer = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const saveCurrentStatus = async () => {
    try {
      if (Platform.OS !== 'android') {
        Alert.alert('Apenas Android', 'Salvar Status está disponível no Android.');
        return;
      }
      const uri = waFiles[viewerIndex];
      if (!uri) return;
      const isVideo = /\.mp4$/i.test(uri);
      const ext = isVideo ? 'mp4' : 'jpg';
      const FileSystem = await import('expo-file-system');
      const MediaLibrary = await import('expo-media-library');
      // Ler conteúdo do content:// como base64 via SAF
      const base64 = await FileSystem.StorageAccessFramework.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const filename = `WA_Status_${Date.now()}.${ext}`;
      const dest = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(dest, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const asset = await MediaLibrary.createAssetAsync(dest);
      let album = await MediaLibrary.getAlbumAsync('ReelMate');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('ReelMate', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      Alert.alert('Salvo ✅', 'Status salvo no álbum ReelMate.');
    } catch (e) {
      console.warn('Save status error', e);
      Alert.alert('Erro', 'Não foi possível salvar o Status.');
    }
  };

  // Load all status information
  const loadStatusInfo = async () => {
    try {
      // Load downloads
      const downloads = await AsyncStorage.getItem('reelmate_downloads');
      if (downloads) {
        const parsedDownloads = JSON.parse(downloads);
        setDownloadedVideos(parsedDownloads);
        
        // Calculate storage used
        const totalSize = parsedDownloads.reduce((acc, video) => {
          const sizeNumber = parseFloat(video.size.replace(' MB', ''));
          return acc + sizeNumber;
        }, 0);
        
        setSystemInfo(prev => ({
          ...prev,
          usedStorage: totalSize,
        }));
      }
      
      // Load recent activity - create some sample activities if none exist
      let activity = await AsyncStorage.getItem('reelmate_activity');
      if (!activity) {
        const sampleActivities = [
          {
            id: Date.now(),
            action: 'App iniciado',
            details: 'ReelMate foi aberto',
            timestamp: new Date().toISOString(),
          }
        ];
        activity = JSON.stringify(sampleActivities);
        await AsyncStorage.setItem('reelmate_activity', activity);
      }
      
      setSystemInfo(prev => ({
        ...prev,
        recentActivity: JSON.parse(activity),
      }));
    } catch (error) {
      console.error('Error loading status info:', error);
    }
  };

  // Check permissions
  const checkPermissions = async () => {
    try {
      setPermissions(prev => ({ ...prev, loading: true }));
      
      if (Platform.OS === 'android') {
        const storagePermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        
        setPermissions({
          storage: storagePermission,
          loading: false,
        });
      } else {
        setPermissions({
          storage: true, // iOS handles this differently
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissions(prev => ({ ...prev, loading: false }));
    }
  };

  // Request storage permission
  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Info', 'Permissões são gerenciadas automaticamente no iOS');
      return;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'ReelMate - Permissão de Storage',
          message: 'Para salvar vídeos baixados na pasta ReelMate, precisamos acessar o armazenamento do seu dispositivo.',
          buttonNeutral: 'Perguntar depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setPermissions(prev => ({ ...prev, storage: true }));
        Alert.alert('Sucesso! ✅', 'Permissão concedida! Agora você pode baixar vídeos para a pasta ReelMate.');
      } else {
        Alert.alert('Permissão Negada', 'Para baixar vídeos, ative a permissão nas configurações do sistema');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStatusInfo();
      checkPermissions();
      loadWhatsAppDirFromStorage().then(() => {
        // tenta carregar imediatamente se já tivermos o URI salvo
        setTimeout(() => loadWhatsAppStatuses(), 0);
      });
    }, [])
  );

  if (!fontsLoaded) {
    return null;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatusInfo();
    await checkPermissions();
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora há pouco';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  const getStoragePercentage = () => {
    if (systemInfo.totalStorage === 0) return 0;
    return (systemInfo.usedStorage / systemInfo.totalStorage) * 100;
  };

  const StatusCard = ({ title, children, icon: Icon, color = '#E91E63' }) => (
    <View style={{
      backgroundColor: '#FFFFFF',
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: `${color}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}>
          <Icon size={18} color={color} />
        </View>
        <Text style={{
          fontSize: 18,
          fontFamily: 'Inter_600SemiBold',
          color: '#1A1A1A',
        }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );

  const StatusItem = ({ label, value, status = 'success', onPress }) => {
    const statusColors = {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3',
    };

    const StatusIcon = {
      success: CheckCircle,
      warning: AlertCircle,
      error: XCircle,
      info: AlertCircle,
    }[status];

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 4,
        }}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <Text style={{
          fontSize: 14,
          fontFamily: 'Inter_400Regular',
          color: '#666666',
          flex: 1,
        }}>
          {label}
        </Text>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 14,
            fontFamily: 'Inter_500Medium',
            color: '#1A1A1A',
            marginRight: 8,
          }}>
            {value}
          </Text>
          <StatusIcon size={16} color={statusColors[status]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['#833AB4', '#FD1D1D', '#FCB045']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={{
            fontSize: 24,
            fontFamily: 'Inter_600SemiBold',
            color: '#FFFFFF',
            textAlign: 'center',
          }}>
            Status do Sistema
          </Text>

          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Activity size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E91E63']}
            tintColor="#E91E63"
          />
        }
      >
        {/* WhatsApp Statuses */}
        {Platform.OS === 'android' && (
          <StatusCard title="WhatsApp Status" icon={Folder} color="#25D366">
            {!waDirUri ? (
              <TouchableOpacity
                onPress={requestWhatsAppStatusesAccess}
                style={{
                  backgroundColor: '#25D366',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginTop: 4,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                  Conectar pasta de Status
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <StatusItem
                  label="Itens encontrados"
                  value={waLoading ? 'Carregando...' : `${waFiles.length} mídias`}
                  status={waLoading ? 'info' : 'success'}
                  onPress={!waLoading ? () => loadWhatsAppStatuses() : undefined}
                />
                {waFiles.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {waFiles.slice(0, 12).map((uri, idx) => (
                      <TouchableOpacity key={uri} style={{ marginRight: 8 }} activeOpacity={0.8} onPress={() => openViewer(idx)}>
                        <View style={{
                          width: 80,
                          height: 120,
                          borderRadius: 8,
                          overflow: 'hidden',
                          backgroundColor: '#F5F5F5',
                        }}>
                          <Image
                            source={{ uri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}
          </StatusCard>
        )}

        {/* Connectivity Status */}
        <StatusCard
          title="Conectividade"
          icon={connectivity.isConnected ? Wifi : WifiOff}
          color={connectivity.isConnected ? '#4CAF50' : '#F44336'}
        >
          <StatusItem
            label="Internet"
            value={connectivity.isConnected ? 'Conectado' : 'Desconectado'}
            status={connectivity.isConnected ? 'success' : 'error'}
          />
          <StatusItem
            label="Tipo"
            value={connectivity.type || 'Wi-Fi'}
            status="info"
          />
        </StatusCard>

        {/* Storage Status */}
        <StatusCard
          title="Armazenamento ReelMate"
          icon={HardDrive}
          color="#2196F3"
        >
          <StatusItem
            label="Vídeos Baixados"
            value={`${downloadedVideos.length} vídeos`}
            status="info"
          />
          <StatusItem
            label="Espaço Usado"
            value={`${systemInfo.usedStorage.toFixed(1)} MB`}
            status="info"
          />
          
          {/* Progress Bar */}
          <View style={{ marginTop: 8, marginBottom: 4 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <Text style={{
                fontSize: 12,
                fontFamily: 'Inter_400Regular',
                color: '#666666',
              }}>
                Pasta ReelMate
              </Text>
              <Text style={{
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
                color: '#2196F3',
              }}>
                {getStoragePercentage().toFixed(1)}% usado
              </Text>
            </View>
            
            <View style={{
              height: 6,
              backgroundColor: '#F0F0F0',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <View style={{
                width: `${Math.min(getStoragePercentage(), 100)}%`,
                height: '100%',
                backgroundColor: '#2196F3',
                borderRadius: 3,
              }} />
            </View>
          </View>
        </StatusCard>

        {/* Permissions Status */}
        <StatusCard
          title="Permissões do Sistema"
          icon={Shield}
          color={permissions.storage ? '#4CAF50' : '#FF9800'}
        >
          <StatusItem
            label="Acesso ao Storage"
            value={permissions.loading ? 'Verificando...' : (permissions.storage ? 'Permitido' : 'Negado')}
            status={permissions.loading ? 'info' : (permissions.storage ? 'success' : 'warning')}
            onPress={!permissions.storage && !permissions.loading ? requestStoragePermission : undefined}
          />
          
          {!permissions.storage && !permissions.loading && (
            <View style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#FFF3E0',
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: '#FF9800',
            }}>
              <Text style={{
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
                color: '#E65100',
                marginBottom: 4,
              }}>
                ⚠️ Permissão Necessária
              </Text>
              <Text style={{
                fontSize: 12,
                fontFamily: 'Inter_400Regular',
                color: '#E65100',
                lineHeight: 18,
              }}>
                Para criar e salvar vídeos na pasta ReelMate, você precisa permitir acesso ao storage. Toque no item acima para solicitar.
              </Text>
            </View>
          )}
        </StatusCard>

        {/* Recent Activity */}
        <StatusCard
          title="Atividade Recente"
          icon={Clock}
          color="#9C27B0"
        >
          {systemInfo.recentActivity.length === 0 ? (
            <View style={{
              alignItems: 'center',
              paddingVertical: 20,
            }}>
              <Text style={{
                fontSize: 14,
                fontFamily: 'Inter_400Regular',
                color: '#9E9E9E',
                textAlign: 'center',
              }}>
                Nenhuma atividade registrada{'\n'}
                Use o app para ver atividades aqui
              </Text>
            </View>
          ) : (
            systemInfo.recentActivity.slice(0, 5).map((activity, index) => (
              <View
                key={activity.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: index < Math.min(systemInfo.recentActivity.length - 1, 4) ? 1 : 0,
                  borderBottomColor: '#F5F5F5',
                }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#E91E6315',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Download size={16} color="#E91E63" />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: 'Inter_500Medium',
                    color: '#1A1A1A',
                    marginBottom: 2,
                  }}>
                    {activity.action || 'Atividade'}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'Inter_400Regular',
                    color: '#666666',
                  }}>
                    {activity.details || 'Sem detalhes'}
                  </Text>
                </View>
                
                <Text style={{
                  fontSize: 11,
                  fontFamily: 'Inter_400Regular',
                  color: '#9E9E9E',
                }}>
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </View>
            ))
          )}
        </StatusCard>

        {/* App Status Summary */}
        <StatusCard
          title="Resumo do ReelMate"
          icon={Folder}
          color="#4CAF50"
        >
          <StatusItem
            label="Versão do App"
            value="1.0.0"
            status="info"
          />
          <StatusItem
            label="Pasta de Downloads"
            value="/Android/ReelMate/"
            status="success"
          />
          <StatusItem
            label="Status Geral"
            value={permissions.storage && connectivity.isConnected ? 'Tudo OK' : 'Verificar'}
            status={permissions.storage && connectivity.isConnected ? 'success' : 'warning'}
          />
          
          {(!permissions.storage || !connectivity.isConnected) && (
            <View style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#E8F5E8',
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: '#4CAF50',
            }}>
              <Text style={{
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
                color: '#2E7D32',
                marginBottom: 4,
              }}>
                💡 Dicas para melhor funcionamento:
              </Text>
              {!connectivity.isConnected && (
                <Text style={{
                  fontSize: 12,
                  fontFamily: 'Inter_400Regular',
                  color: '#2E7D32',
                  lineHeight: 18,
                }}>
                  • Conecte-se à internet para baixar vídeos{'\n'}
                </Text>
              )}
              {!permissions.storage && (
                <Text style={{
                  fontSize: 12,
                  fontFamily: 'Inter_400Regular',
                  color: '#2E7D32',
                  lineHeight: 18,
                }}>
                  • Permita acesso ao storage para salvar vídeos
                </Text>
              )}
            </View>
          )}
        </StatusCard>
      </ScrollView>
    </View>
  );
}