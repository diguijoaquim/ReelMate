import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Menu,
  Play,
  Share,
  Trash2,
  MoreVertical,
  Search,
  Grid3X3,
  List,
  Download,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

export default function DownloadedScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Load downloads from AsyncStorage
  const loadDownloads = async () => {
    try {
      const downloads = await AsyncStorage.getItem("reelmate_downloads");
      if (downloads) {
        const parsedDownloads = JSON.parse(downloads);
        setDownloadedVideos(parsedDownloads);
      }
    } catch (error) {
      console.error("Error loading downloads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load downloads when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDownloads();
    }, []),
  );

  // Calculate totals
  const totalVideos = downloadedVideos.length;
  const totalSize = downloadedVideos.reduce((acc, video) => {
    const sizeNumber = parseFloat(video.size.replace(" MB", ""));
    return acc + sizeNumber;
  }, 0);
  const totalDuration = downloadedVideos.reduce((acc, video) => {
    // Convert duration to seconds for calculation
    const [minutes, seconds] = video.duration.split(":").map(Number);
    return acc + minutes * 60 + seconds;
  }, 0);

  // Format total duration back to minutes
  const formatTotalDuration = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes}m`;
  };

  if (!fontsLoaded) {
    return null;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDownloads();
    setRefreshing(false);
  };

  const handleVideoPress = (video) => {
    const timeAgo = new Date(video.downloadedAt).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    Alert.alert(
      video.title,
      `Baixado em: ${timeAgo}\nTamanho: ${video.size}\nPlataforma: ${video.platform}`,
      [
        {
          text: "Reproduzir",
          onPress: () => console.log("Play video:", video.id),
        },
        { text: "Compartilhar", onPress: () => handleShare(video) },
        {
          text: "Excluir",
          onPress: () => handleDelete(video),
          style: "destructive",
        },
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  const handleShare = (video) => {
    Alert.alert("Compartilhar", `Compartilhando ${video.title}...`);
  };

  const handleDelete = (video) => {
    Alert.alert(
      "Excluir Vídeo",
      `Tem certeza que deseja excluir "${video.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedVideos = downloadedVideos.filter(
                (v) => v.id !== video.id,
              );
              setDownloadedVideos(updatedVideos);
              await AsyncStorage.setItem(
                "reelmate_downloads",
                JSON.stringify(updatedVideos),
              );
            } catch (error) {
              console.error("Error deleting video:", error);
              Alert.alert("Erro", "Não foi possível excluir o vídeo");
            }
          },
        },
      ],
    );
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const downloadDate = new Date(dateString);
    const diffInHours = Math.floor((now - downloadDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Agora há pouco";
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Ontem";
    if (diffInDays < 7) return `${diffInDays} dias atrás`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return "1 semana atrás";
    return `${diffInWeeks} semanas atrás`;
  };

  const renderGridItem = ({ item }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        margin: 6,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      activeOpacity={0.9}
      onPress={() => handleVideoPress(item)}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: item.thumbnail }}
          style={{
            width: "100%",
            aspectRatio: 9 / 16,
            backgroundColor: "#F5F5F5",
          }}
          resizeMode="cover"
        />

        {/* Play Button Overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(0,0,0,0.7)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </View>
        </View>

        {/* Duration Badge */}
        <View
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            backgroundColor: "rgba(0,0,0,0.8)",
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: "Inter_500Medium",
              color: "#FFFFFF",
            }}
          >
            {item.duration}
          </Text>
        </View>

        {/* Platform Badge */}
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor:
              item.platform === "Instagram" ? "#E4405F" : "#1877F2",
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: "Inter_500Medium",
              color: "#FFFFFF",
            }}
          >
            {item.platform}
          </Text>
        </View>
      </View>

      <View style={{ padding: 12 }}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_500Medium",
            color: "#1A1A1A",
            marginBottom: 4,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Inter_400Regular",
            color: "#9E9E9E",
          }}
        >
          {item.size} • {formatTimeAgo(item.downloadedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      activeOpacity={0.9}
      onPress={() => handleVideoPress(item)}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: item.thumbnail }}
          style={{
            width: 80,
            height: 120,
            borderRadius: 8,
            backgroundColor: "#F5F5F5",
          }}
          resizeMode="cover"
        />

        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.7)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={14} color="#FFFFFF" style={{ marginLeft: 1 }} />
          </View>
        </View>

        <View
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            backgroundColor: "rgba(0,0,0,0.8)",
            borderRadius: 3,
            paddingHorizontal: 4,
            paddingVertical: 1,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: "Inter_500Medium",
              color: "#FFFFFF",
            }}
          >
            {item.duration}
          </Text>
        </View>
      </View>

      <View
        style={{ flex: 1, marginLeft: 12, justifyContent: "space-between" }}
      >
        <View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_500Medium",
              color: "#1A1A1A",
              marginBottom: 4,
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View
            style={{
              backgroundColor:
                item.platform === "Instagram" ? "#E4405F" : "#1877F2",
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
              alignSelf: "flex-start",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Inter_500Medium",
                color: "#FFFFFF",
              }}
            >
              {item.platform}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: "#666666",
              }}
            >
              {item.size}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Inter_400Regular",
                color: "#9E9E9E",
              }}
            >
              {formatTimeAgo(item.downloadedAt)}
            </Text>
          </View>

          <TouchableOpacity
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#F5F5F5",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => handleVideoPress(item)}
            activeOpacity={0.7}
          >
            <MoreVertical size={16} color="#9E9E9E" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <StatusBar style="light" />

      {/* Instagram-style gradient header */}
      <LinearGradient
        colors={["#833AB4", "#FD1D1D", "#FCB045"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 24,
              fontFamily: "Inter_600SemiBold",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            Downloads
          </Text>

          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            activeOpacity={0.7}
          >
            {viewMode === "grid" ? (
              <List size={20} color="#FFFFFF" />
            ) : (
              <Grid3X3 size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Summary Stats */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          marginHorizontal: 20,
          marginTop: 20,
          borderRadius: 12,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Inter_600SemiBold",
                color: "#E91E63",
                marginBottom: 4,
              }}
            >
              {totalVideos}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: "#666666",
              }}
            >
              Vídeos
            </Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Inter_600SemiBold",
                color: "#2196F3",
                marginBottom: 4,
              }}
            >
              {totalSize.toFixed(0)}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: "#666666",
              }}
            >
              MB Total
            </Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Inter_600SemiBold",
                color: "#4CAF50",
                marginBottom: 4,
              }}
            >
              {formatTotalDuration(totalDuration)}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: "#666666",
              }}
            >
              Duração
            </Text>
          </View>
        </View>
      </View>

      {downloadedVideos.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#F5F5F5",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Download size={32} color="#9E9E9E" />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontFamily: "Inter_600SemiBold",
              color: "#1A1A1A",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Nenhum Download
          </Text>

          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              color: "#666666",
              lineHeight: 24,
              textAlign: "center",
            }}
          >
            Comece a baixar vídeos do Instagram e Facebook para vê-los aqui na
            pasta ReelMate.
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloadedVideos}
          renderItem={viewMode === "grid" ? renderGridItem : renderListItem}
          numColumns={viewMode === "grid" ? 2 : 1}
          key={viewMode} // Force re-render when switching modes
          contentContainerStyle={{
            padding: viewMode === "grid" ? 14 : 0,
            paddingTop: 20,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#E91E63"]}
              tintColor="#E91E63"
            />
          }
        />
      )}
    </View>
  );
}
