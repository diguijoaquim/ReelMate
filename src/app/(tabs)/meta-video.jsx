import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Menu,
  Download,
  Link,
  Instagram,
  Facebook,
  Play,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

export default function MetaVideoScreen() {
  const insets = useSafeAreaInsets();
  const [videoUrl, setVideoUrl] = useState("");
  const [focusedInput, setFocusedInput] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [step, setStep] = useState("input"); // 'input', 'quality', 'downloading'
  const [downloadProgress, setDownloadProgress] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const qualityScaleAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const ensureMediaPermissions = async () => {
    if (Platform.OS === "web") {
      return true;
    }
    try {
      const MediaLibrary = await import("expo-media-library");
      const perms = await MediaLibrary.getPermissionsAsync();
      if (perms.granted) return true;
      const req = await MediaLibrary.requestPermissionsAsync();
      return req.granted === true;
    } catch (e) {
      console.warn("Media permissions error", e);
      return false;
    }
  };

  // Request storage permission (native via MediaLibrary, web always true)
  const requestStoragePermission = async () => {
    if (Platform.OS === "web") return true;
    const ok = await ensureMediaPermissions();
    if (!ok) {
      Alert.alert(
        "Permissão necessária",
        "Para baixar vídeos, permita acesso à biblioteca de mídia.",
      );
    }
    return ok;
  };

  // Extract video info mutation
  const extractMutation = useMutation({
    mutationFn: async (url) => {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(
        `https://reelmate-jet.vercel.app/?url=${encodedUrl}`,
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      setExtractedData(data);
      setStep("quality");
      // Animate quality options in
      Animated.spring(qualityScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    },
    onError: (error) => {
      Alert.alert("Erro", `Falha ao extrair vídeo: ${error.message}`);
    },
  });

  // Real download function (native) + fallback (web)
  const downloadVideo = async (sourceUrl, filename, quality) => {
    try {
      setDownloadProgress(0);

      if (Platform.OS === "web") {
        const response = await fetch(sourceUrl);
        const blob = await response.blob();
        const sizeMb = (blob.size / 1024 / 1024).toFixed(1);

        // Best-effort: trigger browser download (when available)
        try {
          const urlObject = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = urlObject;
          anchor.download = filename;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          URL.revokeObjectURL(urlObject);
        } catch {}

        const videoData = {
          id: Date.now(),
          title: extractedData.title,
          filename,
          quality,
          size: `${sizeMb} MB`,
          downloadedAt: new Date().toISOString(),
          url: sourceUrl,
          originalUrl: sourceUrl,
          thumbnail: `https://picsum.photos/400/600?random=${Date.now()}`,
          duration: "0:45",
          platform: sourceUrl.includes("instagram") ? "Instagram" : "Facebook",
        };
        const existingDownloads = (await AsyncStorage.getItem("reelmate_downloads")) || "[]";
        const downloads = JSON.parse(existingDownloads);
        downloads.unshift(videoData);
        await AsyncStorage.setItem("reelmate_downloads", JSON.stringify(downloads));
        setDownloadProgress(100);
        return videoData;
      }

      const FileSystem = await import("expo-file-system");
      const MediaLibrary = await import("expo-media-library");

      const downloadResumable = FileSystem.createDownloadResumable(
        sourceUrl,
        FileSystem.cacheDirectory + filename,
        {},
        (progressEvent) => {
          const progress = progressEvent.totalBytesExpectedToWrite
            ? progressEvent.totalBytesWritten / progressEvent.totalBytesExpectedToWrite
            : 0;
          setDownloadProgress(Math.max(1, Math.round(progress * 100)));
        },
      );

      const { uri } = await downloadResumable.downloadAsync();
      const info = await FileSystem.getInfoAsync(uri);

      const asset = await MediaLibrary.createAssetAsync(uri);
      let album = await MediaLibrary.getAlbumAsync("ReelMate");
      if (!album) {
        album = await MediaLibrary.createAlbumAsync("ReelMate", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      const videoData = {
        id: Date.now(),
        title: extractedData.title,
        filename,
        quality,
        size: `${((info?.size || 0) / 1024 / 1024).toFixed(1)} MB`,
        downloadedAt: new Date().toISOString(),
        url: uri,
        originalUrl: sourceUrl,
        thumbnail: `https://picsum.photos/400/600?random=${Date.now()}`,
        duration: "0:45",
        platform: sourceUrl.includes("instagram") ? "Instagram" : "Facebook",
      };

      const existingDownloads = (await AsyncStorage.getItem("reelmate_downloads")) || "[]";
      const downloads = JSON.parse(existingDownloads);
      downloads.unshift(videoData);
      await AsyncStorage.setItem("reelmate_downloads", JSON.stringify(downloads));
      setDownloadProgress(100);
      return videoData;
    } catch (error) {
      throw new Error(`Erro no download: ${error.message}`);
    }
  };

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async ({ url, quality, title }) => {
      // Request permission first
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        throw new Error("Permissão de storage necessária");
      }

      setStep("downloading");

      const filename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_${quality}.mp4`;
      const result = await downloadVideo(url, filename, quality);

      return result;
    },
    onSuccess: (data) => {
      Alert.alert(
        "Download Concluído! ✅",
        `Vídeo "${data.title}" foi salvo na pasta ReelMate!\n\nTamanho: ${data.size}\nQualidade: ${data.quality}`,
        [
          {
            text: "Ver Downloads",
            onPress: () => {
              // Reset and go to downloads tab
              setStep("input");
              setExtractedData(null);
              setSelectedQuality(null);
              setVideoUrl("");
              setDownloadProgress(0);
              qualityScaleAnim.setValue(0);
            },
          },
          {
            text: "Baixar Outro",
            onPress: () => {
              setStep("input");
              setExtractedData(null);
              setSelectedQuality(null);
              setVideoUrl("");
              setDownloadProgress(0);
              qualityScaleAnim.setValue(0);
            },
          },
        ],
      );
    },
    onError: (error) => {
      Alert.alert("Erro no Download", error.message);
      setStep("quality");
      setDownloadProgress(0);
    },
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleExtractVideo = async () => {
    if (!videoUrl.trim()) {
      Alert.alert("Erro", "Por favor, insira uma URL válida");
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    extractMutation.mutate(videoUrl.trim());
  };

  const handleSelectQuality = (quality) => {
    setSelectedQuality(quality);
    const url =
      quality === "best"
        ? extractedData.best_quality
        : extractedData.medium_quality;

    downloadMutation.mutate({
      url,
      quality: quality === "best" ? "Alta Qualidade" : "Qualidade Média",
      title: extractedData.title,
    });
  };

  const handleBack = () => {
    setStep("input");
    setExtractedData(null);
    setSelectedQuality(null);
    qualityScaleAnim.setValue(0);
  };

  const renderInputStep = () => (
    <>
      {/* Welcome Section */}
      <View style={{ marginBottom: 40 }}>
        <Text
          style={{
            fontSize: 28,
            fontFamily: "Inter_600SemiBold",
            color: "#1A1A1A",
            marginBottom: 8,
          }}
        >
          Download Videos
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Inter_400Regular",
            color: "#666666",
            lineHeight: 24,
          }}
        >
          Cole o link do seu vídeo do Instagram ou Facebook abaixo.
        </Text>
      </View>

      {/* Platform Support Cards */}
      <View
        style={{
          flexDirection: "row",
          marginBottom: 40,
          gap: 12,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            padding: 16,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            alignItems: "center",
          }}
        >
          <Instagram size={32} color="#E4405F" style={{ marginBottom: 8 }} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_500Medium",
              color: "#1A1A1A",
            }}
          >
            Instagram
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            padding: 16,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            alignItems: "center",
          }}
        >
          <Facebook size={32} color="#1877F2" style={{ marginBottom: 8 }} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_500Medium",
              color: "#1A1A1A",
            }}
          >
            Facebook
          </Text>
        </View>
      </View>

      {/* URL Input */}
      <View style={{ marginBottom: 30 }}>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Inter_500Medium",
            color: "#1A1A1A",
            marginBottom: 12,
          }}
        >
          URL do Vídeo
        </Text>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 2,
            borderColor: focusedInput ? "#E91E63" : "#E5E5E5",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: focusedInput ? 0.1 : 0.05,
            shadowRadius: 8,
            elevation: focusedInput ? 4 : 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 4,
            }}
          >
            <Link
              size={20}
              color={focusedInput ? "#E91E63" : "#9E9E9E"}
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                fontFamily: "Inter_400Regular",
                color: "#1A1A1A",
                paddingVertical: 16,
              }}
              placeholder="Cole o link do Instagram ou Facebook aqui..."
              placeholderTextColor="#9E9E9E"
              value={videoUrl}
              onChangeText={setVideoUrl}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
      </View>

      {/* Extract Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handleExtractVideo}
          disabled={extractMutation.isPending || !videoUrl.trim()}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={
              extractMutation.isPending || !videoUrl.trim()
                ? ["#CCCCCC", "#AAAAAA"]
                : ["#E91E63", "#FF6B35"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingVertical: 18,
              shadowColor: "#E91E63",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity:
                extractMutation.isPending || !videoUrl.trim() ? 0 : 0.3,
              shadowRadius: 8,
              elevation: extractMutation.isPending || !videoUrl.trim() ? 0 : 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {extractMutation.isPending ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
              ) : (
                <Play size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Inter_600SemiBold",
                  color: "#FFFFFF",
                }}
              >
                {extractMutation.isPending ? "Extraindo..." : "Extrair Vídeo"}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </>
  );

  const renderQualityStep = () => (
    <Animated.View style={{ transform: [{ scale: qualityScaleAnim }] }}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={handleBack}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <ArrowLeft size={24} color="#666666" style={{ marginRight: 8 }} />
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Inter_500Medium",
            color: "#666666",
          }}
        >
          Voltar
        </Text>
      </TouchableOpacity>

      {/* Video Info */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 20,
          marginBottom: 30,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_600SemiBold",
            color: "#1A1A1A",
            marginBottom: 8,
          }}
        >
          Vídeo Encontrado!
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            color: "#666666",
            lineHeight: 20,
          }}
        >
          {extractedData?.title || "Título não disponível"}
        </Text>
      </View>

      {/* Quality Options */}
      <View style={{ marginBottom: 30 }}>
        <Text
          style={{
            fontSize: 20,
            fontFamily: "Inter_600SemiBold",
            color: "#1A1A1A",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Escolha a Qualidade
        </Text>

        {/* High Quality Option */}
        <TouchableOpacity
          onPress={() => handleSelectQuality("best")}
          style={{ marginBottom: 16 }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#4CAF50", "#45A049"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingVertical: 20,
              paddingHorizontal: 24,
              shadowColor: "#4CAF50",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2
                size={24}
                color="#FFFFFF"
                style={{ marginRight: 12 }}
              />
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "Inter_600SemiBold",
                    color: "#FFFFFF",
                  }}
                >
                  Alta Qualidade
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: "#FFFFFF",
                    opacity: 0.9,
                  }}
                >
                  Melhor resolução disponível
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Medium Quality Option */}
        <TouchableOpacity
          onPress={() => handleSelectQuality("medium")}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#FF9800", "#F57C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingVertical: 20,
              paddingHorizontal: 24,
              shadowColor: "#FF9800",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Download size={24} color="#FFFFFF" style={{ marginRight: 12 }} />
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "Inter_600SemiBold",
                    color: "#FFFFFF",
                  }}
                >
                  Qualidade Média
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: "#FFFFFF",
                    opacity: 0.9,
                  }}
                >
                  Download mais rápido
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderDownloadingStep = () => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      }}
    >
      {/* Download Progress Circle */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 8,
          borderColor: "#F0F0F0",
          borderTopColor: "#E91E63",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 30,
          transform: [{ rotate: `${downloadProgress * 3.6}deg` }],
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_600SemiBold",
            color: "#E91E63",
          }}
        >
          {downloadProgress}%
        </Text>
      </View>

      <ActivityIndicator
        size="large"
        color="#E91E63"
        style={{ marginBottom: 20 }}
      />

      <Text
        style={{
          fontSize: 24,
          fontFamily: "Inter_600SemiBold",
          color: "#1A1A1A",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Baixando Vídeo...
      </Text>

      <Text
        style={{
          fontSize: 16,
          fontFamily: "Inter_500Medium",
          color: "#E91E63",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        {selectedQuality === "best" ? "Alta Qualidade" : "Qualidade Média"}
      </Text>

      <Text
        style={{
          fontSize: 14,
          fontFamily: "Inter_400Regular",
          color: "#666666",
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Salvando na pasta ReelMate...{"\n"}
        Por favor, aguarde um momento.
      </Text>

      {/* Progress Bar */}
      <View
        style={{
          width: "100%",
          height: 6,
          backgroundColor: "#F0F0F0",
          borderRadius: 3,
          marginTop: 30,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${downloadProgress}%`,
            height: "100%",
            backgroundColor: "#E91E63",
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
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
              ReelMate
            </Text>

            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 30,
            paddingBottom: insets.bottom + 100,
            flexGrow: step === "downloading" ? 1 : 0,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === "input" && renderInputStep()}
          {step === "quality" && renderQualityStep()}
          {step === "downloading" && renderDownloadingStep()}

          {/* Tips Section - only show on input step */}
          {step === "input" && (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 20,
                marginTop: 30,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Inter_600SemiBold",
                  color: "#1A1A1A",
                  marginBottom: 12,
                }}
              >
                Dicas para melhores resultados:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: "#666666",
                  lineHeight: 20,
                  marginBottom: 8,
                }}
              >
                • Certifique-se de que o vídeo é público
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: "#666666",
                  lineHeight: 20,
                  marginBottom: 8,
                }}
              >
                • Copie a URL completa do navegador
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: "#666666",
                  lineHeight: 20,
                }}
              >
                • Confira a aba Status para o progresso
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
