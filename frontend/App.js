import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
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
const LAST_ROUTE_KEY = 'lastRoute';
const RESTORABLE_ROUTES = new Set([
  'Home',
  'PetProfile',
  'AiAssistant',
  'Community',
  'Knowledge',
  'Settings',
]);

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
          AsyncStorage.getItem(LAST_ROUTE_KEY),
        ]);

        if (token) {
          setInitialRouteName(
            lastRoute && RESTORABLE_ROUTES.has(lastRoute) ? lastRoute : 'Home',
          );
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
    if (!routeName || !RESTORABLE_ROUTES.has(routeName)) {
      return;
    }

    await AsyncStorage.setItem(LAST_ROUTE_KEY, routeName);
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
        <Stack.Screen name="Home" component={HomeScreen} />
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
        <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />
        <Stack.Screen name="Community" component={CommunityScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen name="Knowledge" component={KnowledgeScreen} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
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
