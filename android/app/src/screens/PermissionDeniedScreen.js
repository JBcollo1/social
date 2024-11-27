import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PermissionDeniedScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={{ padding: 20 }}>
      <Text>Permission Denied! Please enable location access to continue.</Text>
      <Button title="Go to Settings" onPress={() => { /* Code to open settings */ }} />
      <Button title="Go to HomeScreen" onPress={() => navigation.navigate('HomeScreen')} />
    </View>
  );
};

export default PermissionDeniedScreen;
