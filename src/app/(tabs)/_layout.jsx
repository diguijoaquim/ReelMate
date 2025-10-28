import { Tabs } from 'expo-router';
import { Video, Download, Clock, Menu } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="meta-video"
        options={{
          title: 'Meta Video',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ 
              padding: 8, 
              borderRadius: 12, 
              backgroundColor: focused ? '#FFE4E1' : 'transparent' 
            }}>
              <Video color={color} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: 'Status',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ 
              padding: 8, 
              borderRadius: 12, 
              backgroundColor: focused ? '#FFE4E1' : 'transparent' 
            }}>
              <Clock color={color} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="downloaded"
        options={{
          title: 'Downloaded',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ 
              padding: 8, 
              borderRadius: 12, 
              backgroundColor: focused ? '#FFE4E1' : 'transparent' 
            }}>
              <Download color={color} size={24} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}