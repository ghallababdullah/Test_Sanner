import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { COLORS } from '../config/theme';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.lightBg }, // Use cardStyle or contentStyle
        animation: 'slide_from_right', // Default animation for all screens
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          animation: 'slide_from_right', // Optional: specific animation for this screen
        }}
      />

     <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

       <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

    <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};
