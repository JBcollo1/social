import React from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './android/app/src/redux/store'; // Adjust the path if necessary
import AppNavigator from './android/app/src/navigation/AppNavigator'; // Adjust the path if necessary

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppNavigator />
      </SafeAreaView>
    </Provider>
  );
};

export default App;
