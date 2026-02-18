import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { DashboardScreen } from '../screens/app/DashboardScreen';
import { TestsNavigator } from './TestsNavigator';
import { ResultsNavigator } from './ResultsNavigator';
import { COLORS, TYPOGRAPHY } from '../config/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder screens for now
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={TYPOGRAPHY.h1}>{title}</Text>
    <Text style={{ marginTop: 12, color: COLORS.lightGray }}>Coming soon...</Text>
  </View>
);

// Screen components for scan stack
const ScannerHubScreen = () => <PlaceholderScreen title="Scanner Hub" />;
const SessionsListScreen = () => <PlaceholderScreen title="Sessions" />;

// Test Stack
const TestStack = () => <TestsNavigator />;

// Results Stack
const ResultStack = () => <ResultsNavigator />;

// Scan Stack
const ScanStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: COLORS.white,
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTitleStyle: {
        ...TYPOGRAPHY.h2,
        color: COLORS.white,
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen
      name="ScannerHub"
      component={ScannerHubScreen}
      options={{ title: 'Scanner' }}
    />
    <Stack.Screen
      name="SessionsList"
      component={SessionsListScreen}
      options={{ title: 'Scanning Sessions' }}
    />
  </Stack.Navigator>
);

// Results Stack
const ResultsStack = () => <ResultStack />;

// Main bottom tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.lightCard,
          borderTopColor: COLORS.lightGray,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.lightGray,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tests"
        component={TestStack}
        options={{
          tabBarLabel: 'Tests',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📝</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanStack}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📸</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Results"
        component={ResultsStack}
        options={{
          tabBarLabel: 'Results',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📊</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
    </Stack.Navigator>
  );
};
