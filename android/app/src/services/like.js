import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LikeButton = ({ postId }) => {
  const [liked, setLiked] = useState(false);

  const toggleLike = async () => {
    const access_token = await AsyncStorage.getItem('access_token');
    try {
      const response = await fetch(`http://192.168.100.82:5000/post/${postId}/like`, {
        method: liked ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setLiked(!liked); // Toggle like state
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <TouchableOpacity onPress={toggleLike}>
      <Text style={liked ? styles.likedText : styles.unlikedText}>
        {liked ? '❤️ Liked' : '🤍 Like'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  likedText: {
    color: 'red',
  },
  unlikedText: {
    color: 'black',
  },
});

export default LikeButton;
