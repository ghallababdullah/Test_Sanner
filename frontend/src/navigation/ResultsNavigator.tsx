import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TestResultsListScreen } from '../screens/results/TestResultsListScreen';
import { StudentResultsListScreen } from '../screens/results/StudentResultsListScreen';
import { StudentResultDetailsScreen } from '../screens/results/StudentResultDetailsScreen';
import { COLORS, TYPOGRAPHY } from '../config/theme';

const Stack = createNativeStackNavigator();

export const ResultsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: TYPOGRAPHY.h2 as any,
        headerTintColor: COLORS.primary,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="TestResultsList"
        component={TestResultsListScreen}
        options={{
          title: 'Results',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="StudentResultsList"
        component={StudentResultsListScreen}
        options={({ route }: any) => ({
          title: route.params?.testTitle || 'Results',
        })}
      />
      <Stack.Screen
        name="ResultDetails"
        component={StudentResultDetailsScreen}
        options={({ route }: any) => ({
          title: route.params?.studentName || 'Result Details',
        })}
      />
    </Stack.Navigator>
  );
};
