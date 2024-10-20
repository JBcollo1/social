import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const Footer = () => {
  const navigation = useNavigation();
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          const decodedToken = jwtDecode(token);
          setCurrentUserId(decodedToken.sub?.id || decodedToken.id);
        } else {
          console.warn('No token found');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    };
    fetchCurrentUserId();
  }, []);

  const navigateToMessages = () => {
    if (currentUserId) {
      navigation.navigate('Messages', { currentUserId });
    } else {
      console.warn('Current user ID not available');
      // Optionally, you can show an alert or navigate to a login screen
    }
  };

  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.iconContainer}>
        <Icon name="home-outline" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={navigateToMessages} style={styles.iconContainer}>
        <Icon name="chatbubbles-outline" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: currentUserId })} style={styles.iconContainer}>
        <Icon name="person-outline" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 50,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  iconContainer: {
    padding: 10,
  },
});

export default Footer;
