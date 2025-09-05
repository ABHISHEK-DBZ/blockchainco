/**
 * Blue Carbon Registry Mobile App
 * GPS-enabled field data collection with offline sync
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';

// Import screens
import LoginScreen from './src/LoginScreen';
import RegisterScreen from './src/RegisterScreen';
import DashboardScreen from './src/DashboardScreen';
import ProjectMapScreen from './src/ProjectMapScreen';
import TaskManagementScreen from './src/TaskManagementScreen';
import FieldDataCollectionScreen from './src/FieldDataCollectionScreen';
import OfflineDataSyncScreen from './src/OfflineDataSyncScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main app screens
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={ProjectMapScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>🗺️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskManagementScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Sync"
        component={OfflineDataSyncScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>📤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen
          name="FieldDataCollection"
          component={FieldDataCollectionScreen}
          options={{
            headerShown: true,
            title: 'Field Data Collection',
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="OfflineDataSync"
          component={OfflineDataSyncScreen}
          options={{
            headerShown: true,
            title: 'Offline Data Sync',
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 5,
  },
  tabIcon: {
    fontSize: 24,
  },
});

export default App;
