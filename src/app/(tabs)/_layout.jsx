import React, { useState } from "react";
import { View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Download, Video, Clock } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import AppHeader from "@/components/AppHeader";
import DrawerMenu from "@/components/DrawerMenu";
import { COLORS } from "@/theme/colors";

const { width: screenWidth } = Dimensions.get("window");
const DRAWER_WIDTH = screenWidth * 0.7;

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isDrawerOpenSV = useSharedValue(0);
  const drawerOffset = useSharedValue(0);

  const toggleDrawer = () => {
    const newState = !isDrawerOpen;
    setIsDrawerOpen(newState);
    isDrawerOpenSV.value = newState ? 1 : 0;
    drawerOffset.value = withSpring(newState ? DRAWER_WIDTH : 0, {
      damping: 20,
      stiffness: 150,
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    isDrawerOpenSV.value = 0;
    drawerOffset.value = withSpring(0, {
      damping: 20,
      stiffness: 150,
    });
  };

  // Gesture handler for closing drawer when tapping outside
  const panGesture = Gesture.Pan()
    .enabled(isDrawerOpen)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < -50) {
        drawerOffset.value = Math.max(0, DRAWER_WIDTH + event.translationX);
      }
    })
    .onEnd((event) => {
      if (event.translationX < -100) {
        closeDrawer();
      } else {
        drawerOffset.value = withSpring(DRAWER_WIDTH);
      }
    });

  const mainContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drawerOffset.value }],
      borderRadius: interpolate(drawerOffset.value, [0, DRAWER_WIDTH], [0, 12]),
      overflow: "hidden",
    };
  });

  const drawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drawerOffset.value - DRAWER_WIDTH }],
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* Drawer */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            zIndex: 1,
          },
          drawerStyle,
        ]}
      >
        <DrawerMenu onClose={closeDrawer} />
      </Animated.View>

      {/* Main Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, mainContainerStyle]}>
          <AppHeader onMenuPress={toggleDrawer} />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: "#1a1a1a",
                // Disable default border; we'll draw a custom one in tabBarBackground
                borderTopWidth: 0,
                // Balance visual spacing: split bottom inset across top/bottom while preserving total height
                paddingTop: 6 + ((insets.bottom || 0) / 2),
                paddingBottom: 6 + ((insets.bottom || 0) / 2),
                height: 65 + (insets.bottom || 0),
              },
              tabBarBackground: () => (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#1a1a1a",
                    borderTopColor: "#333",
                    borderTopWidth: 1,
                  }}
                />
              ),
              tabBarActiveTintColor: COLORS.accent,
              tabBarInactiveTintColor: "#666",
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: "500",
                marginTop: 0,
              },
              tabBarIconStyle: {
                marginBottom: 0,
              },
              tabBarItemStyle: {
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 0,
              },
            }}
          >
            <Tabs.Screen
              name="meta-videos"
              options={{
                title: t('tabs.meta'),
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="logo-instagram" size={22} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="status"
              options={{
                title: t('tabs.status'),
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="logo-whatsapp" size={22} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="history"
              options={{
                title: t('tabs.history'),
                tabBarIcon: ({ color, size }) => (
                  <Clock color={color} size={22} />
                ),
              }}
            />
            <Tabs.Screen
              name="downloaded"
              options={{
                title: t('tabs.downloaded'),
                tabBarIcon: ({ color, size }) => (
                  <Download color={color} size={22} />
                ),
              }}
            />
          </Tabs>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
