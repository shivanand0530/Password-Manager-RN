import { Tabs } from 'expo-router';
import { Shield, Plus, Key, Settings } from 'lucide-react-native';
import { useTheme } from '@/app/context/ThemeContext';
import { lightTheme, darkTheme } from '@/app/styles/theme';

export default function TabLayout() {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Passwords',
          tabBarIcon: ({ size, color }) => (
            <Shield size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ size, color }) => (
            <Plus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generate',
          tabBarIcon: ({ size, color }) => (
            <Key size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}