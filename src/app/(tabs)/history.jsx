import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Clock, 
  Video, 
  Download, 
  Trash2,
  Calendar,
  Filter,
  Search,
  Play,
  ExternalLink
} from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeInUp, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { COLORS } from '@/theme/colors';
import { listDownloadedVideos } from '@/utils/metaVideos';
import { useTranslation } from 'react-i18next';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [historyData, setHistoryData] = useState([]);

  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleButtonPress = () => {
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });
  };

  const fetchDownloads = async () => {
    try {
      setRefreshing(true);
      const items = await listDownloadedVideos();
      setHistoryData(items);
    } catch (e) {
      // no-op
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchDownloads();
  }, []);

  const onRefresh = async () => {
    fetchDownloads();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'facebook': return '#1877F2';
      case 'instagram': return '#E4405F';
      default: return '#666';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'pending': return '#FF9500';
      default: return '#666';
    }
  };

  const filteredHistory = historyData.filter(item => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'completed') return item.status === 'completed';
    if (selectedFilter === 'failed') return item.status === 'failed';
    if (selectedFilter === 'facebook') return item.platform === 'facebook';
    if (selectedFilter === 'instagram') return item.platform === 'instagram';
    return true;
  });

  const handleDeleteItem = (id) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setHistoryData(prev => prev.filter(item => item.id !== id));
          }
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all download history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => setHistoryData([])
        },
      ]
    );
  };

  const FilterButton = ({ filter, label, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: isSelected ? COLORS.accent : '#333',
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      activeOpacity={0.8}
    >
      <Text style={{
        color: '#fff',
        fontWeight: isSelected ? '600' : '500',
        fontSize: 13,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const HistoryItem = ({ item, index }) => (
    <Animated.View
      entering={SlideInRight.delay(index * 100)}
      style={{
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
      }}
    >
      {/* Header Row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: getPlatformColor(item.platform),
            marginRight: 8,
          }} />
          <Text style={{
            fontSize: 12,
            color: '#999',
            textTransform: 'capitalize',
          }}>
            {item.platform}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => handleDeleteItem(item.id)}
          style={{
            padding: 4,
          }}
        >
          <Trash2 size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
      }}>
        <Video color={COLORS.accent} size={18} style={{ marginRight: 10, marginTop: 2 }} />
        <Text style={{
          fontSize: 15,
          color: '#fff',
          fontWeight: '500',
          flex: 1,
          lineHeight: 20,
        }}>
          {item.title}
        </Text>
      </View>

      {/* Status and Details */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <View style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: getStatusColor(item.status),
            marginRight: 6,
          }} />
          <Text style={{
            fontSize: 12,
            color: getStatusColor(item.status),
            fontWeight: '500',
            textTransform: 'capitalize',
          }}>
            {item.status}
          </Text>
        </View>

        <Text style={{
          fontSize: 12,
          color: '#666',
        }}>
          {item.quality === 'best_quality' ? 'Best Quality' : 'Medium Quality'} • {item.fileSize}
        </Text>
      </View>

      {/* Date and Actions */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Clock size={14} color="#666" style={{ marginRight: 6 }} />
          <Text style={{
            fontSize: 12,
            color: '#666',
          }}>
            {formatDate(item.downloadDate)} at {formatTime(item.downloadDate)}
          </Text>
        </View>

        {item.status === 'completed' && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#333',
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 6,
            }}
          >
            <Play size={12} color={COLORS.accent} style={{ marginRight: 4 }} />
            <Text style={{
              fontSize: 11,
              color: COLORS.accent,
              fontWeight: '500',
            }}>
              Play
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#000',
    }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
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
            {t('history.headerTitle')}
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#666',
            lineHeight: 22,
          }}>
            {t('history.headerSubtitle')}
          </Text>
        </Animated.View>

        {/* Filter Section */}
        <Animated.View 
          entering={FadeInUp.delay(300)}
          style={{
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Filter size={18} color="#666" style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 14,
              color: '#999',
              fontWeight: '500',
            }}>
              {t('history.filterBy')}
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <FilterButton
              filter="all"
              label={t('history.filterAll')}
              isSelected={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
            />
            <FilterButton
              filter="completed"
              label={t('history.filterCompleted')}
              isSelected={selectedFilter === 'completed'}
              onPress={() => setSelectedFilter('completed')}
            />
            <FilterButton
              filter="failed"
              label={t('history.filterFailed')}
              isSelected={selectedFilter === 'failed'}
              onPress={() => setSelectedFilter('failed')}
            />
            <FilterButton
              filter="facebook"
              label={t('history.filterFacebook')}
              isSelected={selectedFilter === 'facebook'}
              onPress={() => setSelectedFilter('facebook')}
            />
            <FilterButton
              filter="instagram"
              label={t('history.filterInstagram')}
              isSelected={selectedFilter === 'instagram'}
              onPress={() => setSelectedFilter('instagram')}
            />
          </ScrollView>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View 
          entering={FadeInUp.delay(400)}
          style={{
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <View style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#333',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#fff',
                }}>
                  {historyData.length}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#666',
                  marginTop: 2,
                }}>
                  {t('history.totalDownloads')}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#34C759',
                }}>
                  {historyData.filter(item => item.status === 'completed').length}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#666',
                  marginTop: 2,
                }}>
                  {t('history.successful')}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#FF3B30',
                }}>
                  {historyData.filter(item => item.status === 'failed').length}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#666',
                  marginTop: 2,
                }}>
                  {t('history.failed')}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* History List */}
        <Animated.View 
          entering={FadeInUp.delay(500)}
          style={{
            paddingHorizontal: 20,
          }}
        >
          {filteredHistory.length > 0 ? (
            <>
              {filteredHistory.map((item, index) => (
                <HistoryItem key={item.id} item={item} index={index} />
              ))}
              
              {/* Clear All Button */}
              <Animated.View 
                style={[buttonAnimatedStyle, { marginTop: 20 }]}
              >
                <TouchableOpacity
                  onPress={() => {
                    handleButtonPress();
                    handleClearAll();
                  }}
                  style={{
                    backgroundColor: '#333',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#444',
                  }}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#FF3B30" style={{ marginRight: 8 }} />
                  <Text style={{
                    color: '#FF3B30',
                    fontSize: 15,
                    fontWeight: '500',
                  }}>
                    {t('history.clearAll')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: 40,
            }}>
              <Clock size={48} color="#333" style={{ marginBottom: 16 }} />
              <Text style={{
                fontSize: 18,
                color: '#666',
                fontWeight: '500',
                marginBottom: 8,
              }}>
                {t('history.emptyTitle')}
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#999',
                textAlign: 'center',
                lineHeight: 20,
              }}>
                {selectedFilter === 'all' 
                  ? t('history.emptyTextAll')
                  : t('history.emptyTextFilter', { filter: selectedFilter })}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}