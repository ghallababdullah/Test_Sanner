import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TestsListScreen } from '../screens/tests/TestsListScreen';
import { CreateTestScreen } from '../screens/tests/CreateTestScreen';
import { TestDetailsScreen } from '../screens/tests/TestDetailsScreen';
import { StudentResultsListScreen } from '../screens/results/StudentResultsListScreen';
import { StudentResultDetailsScreen } from '../screens/results/StudentResultDetailsScreen';
import { COLORS, TYPOGRAPHY } from '../config/theme';

const Stack = createNativeStackNavigator();

export const TestsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: TYPOGRAPHY.h2 as any,
        headerTintColor: COLORS.primary,
      }}
      initialRouteName="TestsList"
    >
      <Stack.Screen
        name="TestsList"
        component={TestsListScreen}
        options={{
          title: 'My Tests',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateTest"
        component={CreateTestScreen}
        options={{
          title: 'Create Test',
        }}
      />
      <Stack.Screen
        name="TestDetails"
        component={TestDetailsScreen}
        options={{
          title: 'Test Details',
        }}
      />
      <Stack.Screen
        name="StudentResultsList"
        component={StudentResultsListScreen}
        options={{
          title: 'Student Results',
        }}
      />
      <Stack.Screen
        name="ResultDetails"
        component={StudentResultDetailsScreen}
        options={{
          title: 'Result Details',
        }}
      />
    </Stack.Navigator>
  );
};
