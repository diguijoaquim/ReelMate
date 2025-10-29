import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import NativeScrollView from "@/components/NativeScrollView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { Download, Link, Play, Eye, CheckCircle } from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useMutation } from "@tanstack/react-query";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { COLORS } from "@/theme/colors";
 import { downloadMetaVideo, requestStoragePermissions } from "@/utils/metaVideos";

export default function MetaVideosScreen() {
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState("");
  const [videoData, setVideoData] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState("best_quality");
  const [downloadProgress, setDownloadProgress] = useState(0);

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

  const fetchVideoMutation = useMutation({
    mutationFn: async (videoUrl) => {
      const response = await fetch(
        `https://reelmate-jet.vercel.app/?url=${encodeURIComponent(videoUrl)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch video data");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setVideoData(data);
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        "Failed to fetch video information. Please check the URL and try again.",
      );
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async ({ url, quality }) => {
      // Verificar permissões de armazenamento primeiro
      const hasPermission = await requestStoragePermissions();
      if (!hasPermission) {
        throw new Error("Permissões não concedidas");
      }
      
      // Realizar o download do vídeo para o diretório 0/ReelMate
      return await downloadMetaVideo(url, quality, (progress) => {
        setDownloadProgress(progress);
      });
    },
    onSuccess: (result) => {
      if (result && result.success) {
        Alert.alert(
          "Sucesso", 
          `Vídeo baixado com sucesso! Você pode encontrá-lo em:

1. Galeria de fotos no álbum "ReelMate"
2. Pasta de Downloads/ReelMate no armazenamento interno`
        );
      } else {
        Alert.alert(
          "Erro",
          `Falha ao baixar o vídeo: ${result?.error || 'Erro desconhecido'}`
        );
      }
      setDownloadProgress(0);
    },
    onError: (error) => {
      Alert.alert(
        "Erro", 
        `Falha ao baixar o vídeo: ${error.message || 'Verifique as permissões de armazenamento'}`
      );
      setDownloadProgress(0);
    },
  });

  const handleFetchVideo = () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a valid Facebook or Instagram URL");
      return;
    }

    if (
      !url.includes("facebook.com") &&
      !url.includes("instagram.com") &&
      !url.includes("fb.com")
    ) {
      Alert.alert("Error", "Please enter a valid Facebook or Instagram URL");
      return;
    }

    handleButtonPress();
    fetchVideoMutation.mutate(url.trim());
  };

  const handleDownload = async () => {
    if (!videoData) return;

    const downloadUrl = videoData[selectedQuality];
    downloadMutation.mutate({ url: downloadUrl, quality: selectedQuality });
  };

  const QualityButton = ({ quality, label, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: isSelected ? COLORS.accent : "#333",
        marginHorizontal: 4,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
      }}
      activeOpacity={0.8}
    >
      {isSelected && (
        <CheckCircle size={16} color="#fff" style={{ marginRight: 6 }} />
      )}
      <Text
        style={{
          color: "#fff",
          fontWeight: isSelected ? "600" : "500",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
        }}
      >
        <NativeScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#fff",
                marginBottom: 8,
              }}
            >
              Download Videos
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#666",
                lineHeight: 22,
              }}
            >
              Paste your Facebook or Instagram video URL below to download
            </Text>
          </Animated.View>

          {/* URL Input Section */}
          <Animated.View
            entering={FadeInUp.delay(300)}
            style={{
              paddingHorizontal: 20,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                borderWidth: 2,
                borderColor: url ? COLORS.accent : "#333",
                paddingHorizontal: 16,
                paddingVertical: 4,
              }}
            >
              <Link color="#666" size={20} style={{ marginRight: 12 }} />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: "#fff",
                  paddingVertical: 16,
                }}
                placeholder="Paste Facebook or Instagram URL here..."
                placeholderTextColor="#666"
                value={url}
                onChangeText={setUrl}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </Animated.View>

          {/* Fetch Button */}
          <Animated.View
            entering={FadeInUp.delay(400)}
            style={{
              paddingHorizontal: 20,
              marginBottom: 32,
            }}
          >
            <TouchableOpacity
              onPress={handleFetchVideo}
              disabled={fetchVideoMutation.isPending}
              style={{
                backgroundColor: COLORS.accent,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                opacity: fetchVideoMutation.isPending ? 0.7 : 1,
              }}
            >
              {fetchVideoMutation.isPending ? (
                <ActivityIndicator
                  color="#fff"
                  size="small"
                  style={{ marginRight: 8 }}
                />
              ) : (
                <Eye size={20} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {fetchVideoMutation.isPending
                  ? "Fetching..."
                  : "Get Video Info"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Video Preview Section */}
          {videoData && (
            <Animated.View
              entering={BounceIn.delay(100)}
              style={{
                paddingHorizontal: 20,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 12,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#333",
                }}
              >
                {/* Video Title */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <Play
                    color={COLORS.accent}
                    size={20}
                    style={{ marginRight: 12, marginTop: 2 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#fff",
                      fontWeight: "500",
                      flex: 1,
                      lineHeight: 22,
                    }}
                  >
                    {videoData.title}
                  </Text>
                </View>

                {/* Quality Selection */}
                <Text
                  style={{
                    fontSize: 14,
                    color: "#999",
                    marginBottom: 12,
                  }}
                >
                  Choose Quality:
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 20,
                  }}
                >
                  <QualityButton
                    quality="best_quality"
                    label="Best Quality"
                    isSelected={selectedQuality === "best_quality"}
                    onPress={() => setSelectedQuality("best_quality")}
                  />
                  <QualityButton
                    quality="medium_quality"
                    label="Medium Quality"
                    isSelected={selectedQuality === "medium_quality"}
                    onPress={() => setSelectedQuality("medium_quality")}
                  />
                </View>

                {/* Download Button */}
                <Animated.View style={buttonAnimatedStyle}>
                  <TouchableOpacity
                    onPress={handleDownload}
                    disabled={downloadMutation.isPending}
                    style={{
                      backgroundColor: COLORS.success,
                      borderRadius: 10,
                      paddingVertical: 14,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      opacity: downloadMutation.isPending ? 0.7 : 1,
                    }}
                  >
                    {downloadMutation.isPending ? (
                      <>
                        <ActivityIndicator
                          color="#fff"
                          size="small"
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: "600",
                          }}
                        >
                          Downloading... {downloadProgress}%
                        </Text>
                      </>
                    ) : (
                      <>
                        <Download
                          size={18}
                          color="#fff"
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: "600",
                          }}
                        >
                          Download Video
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          )}

          {/* Help Section */}
          <Animated.View
            entering={FadeIn.delay(500)}
            style={{
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 20,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.accent,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: "#fff",
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                How to use:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#999",
                  lineHeight: 20,
                }}
              >
                1. Copy the video URL from Facebook or Instagram{"\n"}
                2. Paste it in the input field above{"\n"}
                3. Tap "Get Video Info" to fetch video details{"\n"}
                4. Choose your preferred quality{"\n"}
                5. Tap "Download Video" to save it to your device
          </Text>
            </View>
          </Animated.View>
        </NativeScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
