/**
 * Test Scanner App - Main Entry Point
 * 
 * Providers hierarchy:
 * - ToastProvider: Provides toast notifications
 * - AuthProvider: Manages authentication state and bootstraps session
 * - RootNavigator: Switches between Auth and App stacks based on auth state
 */

import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/components/ui/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;