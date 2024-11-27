import React, { useState } from 'react';
import { View, Button, TextInput, Text } from 'react-native';
import axios from 'axios';

const App = () => {
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('');

  const registerDevice = async () => {
    try {
      const response = await axios.post('http://your-flask-server-ip:5000/register_device', {
        device_id: deviceId,
      });
      setStatus(response.data.message);
    } catch (error) {
      setStatus('Error registering device.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Enter Device ID:</Text>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
        onChangeText={setDeviceId}
        value={deviceId}
      />
      <Button title="Register Device" onPress={registerDevice} />
      <Text>Status: {status}</Text>
    </View>
  );
};

export default App;
