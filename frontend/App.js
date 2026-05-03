import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import PetProfileScreen from './src/screens/PetProfileScreen';
import AddPetScreen from './src/screens/AddPetScreen';
import EditPetScreen from './src/screens/EditPetScreen';
import HealthManagementScreen from './src/screens/HealthManagementScreen';
import AddVaccinationScreen from './src/screens/AddVaccinationScreen';
import AddDewormingScreen from './src/screens/AddDewormingScreen';
import AddCheckupScreen from './src/screens/AddCheckupScreen';
import CareManagementScreen from './src/screens/CareManagementScreen';
import AddCareScreen from './src/screens/AddCareScreen';
import AiAssistantScreen from './src/screens/AiAssistantScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import KnowledgeScreen from './src/screens/KnowledgeScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2f7d4f',
        tabBarInactiveTintColor: '#91a098',
        tabBarStyle: {
          height: 66,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5ece7',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color }) => {
          const icons = {
            HomeTab: '⌂',
            KnowledgeTab: '✦',
            AiTab: '◉',
            CommunityTab: '◎',
            SettingsTab: '⚙',
          };

          return (
            <Text style={{ color, fontSize: 18, fontWeight: '700' }}>
              {icons[route.name] || '•'}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="KnowledgeTab" component={KnowledgeScreen} options={{ title: '知识' }} />
      <Tab.Screen name="AiTab" component={AiAssistantScreen} options={{ title: 'AI助手' }} />
      <Tab.Screen name="CommunityTab" component={CommunityScreen} options={{ title: '交流' }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState('Login');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const root = document.getElementById('root');
    const webRoots = [document.documentElement, document.body, root].filter(Boolean);

    webRoots.forEach((node) => {
      node.style.height = '100%';
      node.style.overflow = 'auto';
    });

    document.body.style.overscrollBehaviorY = 'auto';
    document.body.style.WebkitOverflowScrolling = 'touch';
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [token, lastRoute] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('lastRoute'),
        ]);

        if (token) {
          setInitialRouteName(lastRoute === 'Login' ? 'Login' : 'MainTabs');
          return;
        }

        setInitialRouteName('Login');
      } catch (error) {
        setInitialRouteName('Login');
      } finally {
        setBootstrapped(true);
      }
    };

    void bootstrap();
  }, []);

  const handleNavigationStateChange = async () => {
    const routeName = navigationRef.current?.getCurrentRoute?.()?.name;
    if (!routeName) {
      return;
    }

    const persistedRoute = routeName === 'Login' || routeName === 'Register' ? routeName : 'MainTabs';
    await AsyncStorage.setItem('lastRoute', persistedRoute);
  };

  const bootView = useMemo(
    () => (
      <View style={styles.bootContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.bootText}>正在恢复登录状态...</Text>
      </View>
    ),
    [],
  );

  if (!bootstrapped) {
    return bootView;
  }

  return (
    <NavigationContainer ref={navigationRef} onStateChange={() => void handleNavigationStateChange()}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="PetProfile" component={PetProfileScreen} />
        <Stack.Screen name="AddPet" component={AddPetScreen} />
        <Stack.Screen name="EditPet" component={EditPetScreen} />
        <Stack.Screen name="HealthManagement" component={HealthManagementScreen} />
        <Stack.Screen name="AddVaccination" component={AddVaccinationScreen} />
        <Stack.Screen name="EditVaccination" component={AddVaccinationScreen} />
        <Stack.Screen name="AddDeworming" component={AddDewormingScreen} />
        <Stack.Screen name="EditDeworming" component={AddDewormingScreen} />
        <Stack.Screen name="AddCheckup" component={AddCheckupScreen} />
        <Stack.Screen name="EditCheckup" component={AddCheckupScreen} />
        <Stack.Screen name="CareManagement" component={CareManagementScreen} />
        <Stack.Screen name="AddCare" component={AddCareScreen} />
        <Stack.Screen name="EditCare" component={AddCareScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = {
  bootContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    gap: 12,
  },
  bootText: {
    fontSize: 15,
    color: '#666',
  },
};
