

import React from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import AppNavigator from './android/app/src/navigation/AppNavigator'; // Adjust the path if necessary

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaView>
  );
};

export default App;