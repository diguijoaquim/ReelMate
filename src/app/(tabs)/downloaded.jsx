import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  FlatList,
  Share,
  Dimensions,
  Platform,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Play,
  Share as ShareIcon,
  Trash2,
  FileText,
  Calendar,
  HardDrive,
  MoreVertical,
  Search,
  Filter,
  X
} from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeInUp, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { Video } from 'expo-av';
import { COLORS } from '@/theme/colors';
import { listDownloadedVideos } from '@/utils/metaVideos';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function DownloadedScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState([]);
  const [filter, setFilter] = useState('all'); // all, videos, images
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, size
  const [refreshing, setRefreshing] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const filterOpacity = useSharedValue(1);

  const fetchDownloads = async () => {
    try {
      setRefreshing(true);
      const items = await listDownloadedVideos();
      const mapped = items.map((it) => ({
        id: it.id,
        type: 'video',
        title: it.title,
        thumbnail: 'https://picsum.photos/400/300?random=99',
        source: 'Local',
        size: it.fileSize || '-',
        duration: undefined,
        downloadedAt: new Date(it.downloadDate).getTime(),
        quality: it.quality || 'unknown',
        url: it.url,
      }));
      setDownloads(mapped);
    } catch (e) {
      setDownloads([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchDownloads();
    }, [])
  );

  const onRefresh = () => {
    fetchDownloads();
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const downloadDate = new Date(timestamp);
    const diffInHours = Math.floor((now - downloadDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - downloadDate) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getTotalSize = () => {
    const totalMB = downloads.reduce((acc, item) => {
      const size = parseFloat(item.size.replace(' MB', ''));
      return acc + size;
    }, 0);
    
    if (totalMB > 1024) {
      return `${(totalMB / 1024).toFixed(1)} GB`;
    }
    return `${totalMB.toFixed(1)} MB`;
  };

  const handleShare = async (item) => {
    try {
      await Share.share({
        message: `Check out this video: ${item.title}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDownloads(downloads.filter(d => d.id !== item.id));
            Alert.alert('Success', 'Video deleted successfully');
          }
        }
      ]
    );
  };

  const FilterButton = ({ value, label, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: isSelected ? COLORS.accent : '#333',
        marginRight: 8,
      }}
      activeOpacity={0.8}
    >
      <Text style={{
        color: isSelected ? '#fff' : '#999',
        fontSize: 13,
        fontWeight: isSelected ? '600' : '500',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const DownloadItem = ({ item, index }) => (
    <Animated.View
      entering={SlideInRight.delay(index * 50)}
      style={{
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={() => { setCurrentItem(item); setIsPlayerOpen(true); }}>
        <View style={{ flexDirection: 'row' }}>
          {/* Thumbnail */}
          <View style={{ position: 'relative' }}>
            <ExpoImage
              source={{ uri: item.thumbnail }}
              style={{ 
                width: 100, 
                height: 80,
              }}
              contentFit="cover"
              transition={200}
            />
            
            {/* Play overlay */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.9)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Play size={16} color="#000" />
              </View>
            </View>

            {/* Duration */}
            {item.duration ? (<View style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              backgroundColor: 'rgba(0,0,0,0.8)',
              borderRadius: 4,
              paddingHorizontal: 4,
              paddingVertical: 2,
            }}>
              <Text style={{
                color: '#fff',
                fontSize: 10,
                fontWeight: '500',
              }}>
                {item.duration}
              </Text>
            </View>) : null}
          </View>

          {/* Content */}
          <View style={{ flex: 1, padding: 16 }}>
            <Text 
              numberOfLines={2}
              style={{
                fontSize: 15,
                fontWeight: '500',
                color: '#fff',
                lineHeight: 20,
                marginBottom: 8,
              }}
            >
              {item.title}
            </Text>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <View style={{
                backgroundColor: item.source === 'Facebook' ? '#1877F2' : (item.source === 'Instagram' ? '#E4405F' : COLORS.accent),
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                marginRight: 8,
              }}>
                <Text style={{
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: '600',
                }}>
                  {item.source}
                </Text>
              </View>
              
              <View style={{
                backgroundColor: '#333',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <Text style={{
                  color: '#999',
                  fontSize: 10,
                  fontWeight: '500',
                }}>
                  {item.quality}
                </Text>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <View>
                <Text style={{
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 2,
                }}>
                  {item.size} • {formatTimestamp(item.downloadedAt)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  onPress={() => handleShare(item)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#333',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <ShareIcon size={14} color="#999" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#333',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <Trash2 size={14} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
        No Downloads Yet
      </Text>
      <Text style={{
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
      }}>
        Your downloaded videos will appear here. Go to Meta Videos tab to start downloading!
      </Text>
    </Animated.View>
  );

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#000',
    }}>
      {/* Fullscreen player */}
      {isPlayerOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 10 }}>
          <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setIsPlayerOpen(false)} style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {currentItem?.url ? (
              <Video
                source={{ uri: currentItem.url }}
                style={{ flex: 1 }}
                resizeMode="contain"
                shouldPlay
                useNativeControls
              />
            ) : null}
          </View>
        </View>
      )}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} colors={[COLORS.accent]} />
        }
        bounces={Platform.OS === "android"}
        overScrollMode={Platform.OS === "android" ? "always" : "auto"}
      >
        {/* Header Section */}
        <Animated.View 
          entering={FadeIn.delay(200)}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 24,
          }}
        >
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 8,
          }}>
            {t('downloaded.headerTitle')}
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#666',
            lineHeight: 22,
          }}>
            {t('downloaded.headerSubtitle')}
          </Text>
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
              justifyContent: 'space-between',
            }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <HardDrive color={COLORS.accent} size={20} style={{ marginBottom: 8 }} />
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: 2,
                }}>
                  {downloads.length}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#666',
                }}>
                  {t('downloaded.statsVideos')}
                </Text>
              </View>
              
              <View style={{
                width: 1,
                backgroundColor: '#333',
                marginHorizontal: 20,
              }} />
              
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Calendar color={COLORS.success} size={20} style={{ marginBottom: 8 }} />
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: 2,
                }}>
                  {getTotalSize()}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#666',
                }}>
                  {t('downloaded.statsTotalSize')}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Filter Section */}
        <Animated.View 
          entering={FadeInUp.delay(400)}
          style={{
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#fff',
            marginBottom: 12,
          }}>
            {t('downloaded.filterBy')}
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <FilterButton
              value="all"
              label={t('downloaded.filterAll')}
              isSelected={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <FilterButton
              value="videos"
              label={t('downloaded.filterVideos')}
              isSelected={filter === 'videos'}
              onPress={() => setFilter('videos')}
            />
            <FilterButton
              value="facebook"
              label={t('downloaded.filterFacebook')}
              isSelected={filter === 'facebook'}
              onPress={() => setFilter('facebook')}
            />
            <FilterButton
              value="instagram"
              label={t('downloaded.filterInstagram')}
              isSelected={filter === 'instagram'}
              onPress={() => setFilter('instagram')}
            />
          </ScrollView>
        </Animated.View>

        {/* Downloads List */}
        {downloads.length > 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <FlatList
              data={downloads}
              renderItem={({ item, index }) => <DownloadItem item={item} index={index} />}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              bounces={Platform.OS === "android"}
              overScrollMode={Platform.OS === "android" ? "always" : "auto"}
            />
          </View>
        ) : (
          <EmptyState />
        )}

        {/* Clear All Button */}
        {downloads.length > 0 && (
          <Animated.View 
            entering={FadeIn.delay(600)}
            style={{
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  t('downloaded.clearAll'),
                  t('downloaded.clearAll'),
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: t('downloaded.clearAll'),
                      style: 'destructive',
                      onPress: () => {
                        setDownloads([]);
                        Alert.alert('Success', t('downloaded.clearAll'));
                      }
                    }
                  ]
                );
              }}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#FF3B30',
              }}
              activeOpacity={0.8}
            >
              <Text style={{
                color: '#FF3B30',
                fontSize: 15,
                fontWeight: '600',
              }}>
                {t('downloaded.clearAll')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}