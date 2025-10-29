import React, { useState } from "react";
import { View, Dimensions } from "react-native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Download, MessageSquare, Video, Clock } from "lucide-react-native";
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
    .onUpdate((event) => {
      if (isDrawerOpenSV.value === 1 && event.translationX < -50) {
        drawerOffset.value = Math.max(0, DRAWER_WIDTH + event.translationX);
      }
    })
    .onEnd((event) => {
      if (isDrawerOpenSV.value === 1 && event.translationX < -100) {
        closeDrawer();
      } else if (isDrawerOpenSV.value === 1) {
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
                borderTopColor: "#333",
                borderTopWidth: 1,
                paddingTop: 8,
                paddingBottom: 8,
                height: 60,
              },
              tabBarActiveTintColor: COLORS.accent,
              tabBarInactiveTintColor: "#666",
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: "500",
                marginTop: 4,
              },
              tabBarIconStyle: {
                marginBottom: 4,
              },
            }}
          >
            <Tabs.Screen
              name="meta-videos"
              options={{
                title: "Meta Videos",
                tabBarIcon: ({ color, size }) => (
                  <Video color={color} size={22} />
                ),
              }}
            />
            <Tabs.Screen
              name="status"
              options={{
                title: "Status",
                tabBarIcon: ({ color, size }) => (
                  <MessageSquare color={color} size={22} />
                ),
              }}
            />
            <Tabs.Screen
              name="history"
              options={{
                title: "History",
                tabBarIcon: ({ color, size }) => (
                  <Clock color={color} size={22} />
                ),
              }}
            />
            <Tabs.Screen
              name="downloaded"
              options={{
                title: "Downloaded",
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
