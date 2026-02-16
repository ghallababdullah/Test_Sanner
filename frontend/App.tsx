/**
 * Template Scanner App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ROITestScreen from './src/screens/ROITestScreen';

// Create stack navigator
const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="ROITest" 
          component={ROITestScreen} 
          options={{ title: 'Template Scanner - ROI Test' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;