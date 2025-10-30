import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from "react-native";
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
import { COLORS } from "@/theme/colors";
 import { downloadMetaVideo, requestStoragePermissions } from "@/utils/metaVideos";
import { Video } from "expo-av";
import AppDialog from "@/components/AppDialog";
import { useTranslation } from "react-i18next";

export default function MetaVideosScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [videoData, setVideoData] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState("best_quality");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);

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
      setIsPreviewPlaying(false);
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
          `Vídeo baixado com sucesso!`
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
    const raw = url.trim();
    if (!raw) {
      Alert.alert("Error", "Please enter a valid Facebook or Instagram URL");
      return;
    }

    // Bloqueia links do YouTube
    const lower = raw.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      setShowBlockedDialog(true);
      return;
    }

    if (
      !lower.includes("facebook.com") &&
      !lower.includes("instagram.com") &&
      !lower.includes("fb.com")
    ) {
      Alert.alert("Error", "Please enter a valid Facebook or Instagram URL");
      return;
    }

    handleButtonPress();
    fetchVideoMutation.mutate(raw);
  };

  const handleDownload = async () => {
    if (!videoData) return;

    const raw = url.trim().toLowerCase();
    if (raw.includes("youtube.com") || raw.includes("youtu.be")) {
      setShowBlockedDialog(true);
      return;
    }

    const downloadUrl = videoData[selectedQuality];
    downloadMutation.mutate({ url: downloadUrl, quality: selectedQuality });
  };

  const previewUrl = videoData
    ? videoData.best_quality || videoData.medium_quality || videoData.url
    : null;
  const poster = videoData?.thumbnail || videoData?.thumb || undefined;

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
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <AppDialog
        visible={showBlockedDialog}
        title={t('dialogs.ytBlockedTitle')}
        message={t('dialogs.ytBlockedText')}
        onClose={() => setShowBlockedDialog(false)}
        confirmLabel={t('actions.ok')}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          alwaysBounceVertical={true}
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
              {t('meta.headerTitle')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#666",
                lineHeight: 22,
              }}
            >
              {t('meta.headerSubtitle')}
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
                placeholder={t('meta.inputPlaceholder')}
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
                  ? t('meta.fetching')
                  : t('meta.getInfo')}
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
                <View
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: "#000",
                    marginBottom: 16,
                  }}
                >
                  <View style={{ width: "100%", aspectRatio: 16 / 9 }}>
                    {isPreviewPlaying && previewUrl ? (
                      <Video
                        source={{ uri: previewUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="contain"
                        shouldPlay
                        useNativeControls
                        onError={() => {}}
                      />
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setIsPreviewPlaying(true)}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          backgroundColor: "#000",
                        }}
                      >
                        {poster ? (
                          <Image
                            source={{ uri: poster }}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              width: "100%",
                              height: "100%",
                            }}
                            resizeMode="cover"
                          />
                        ) : null}
                        <View
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: COLORS.accent,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Play color="#fff" size={28} />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
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
                  {t('meta.chooseQuality')}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 20,
                  }}
                >
                  <QualityButton
                    quality="best_quality"
                    label={t('meta.qualityBest')}
                    isSelected={selectedQuality === "best_quality"}
                    onPress={() => setSelectedQuality("best_quality")}
                  />
                  <QualityButton
                    quality="medium_quality"
                    label={t('meta.qualityMedium')}
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
                          {`Downloading... ${downloadProgress}%`}
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
                          {t('meta.downloadButton')}
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
                {t('meta.howToUseTitle')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#999",
                  lineHeight: 20,
                }}
              >
                {t('meta.howToUseSteps')}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
