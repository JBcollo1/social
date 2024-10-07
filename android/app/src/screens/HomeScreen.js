import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import Video from 'react-native-video'; // For rendering videos
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window'); // Get screen dimensions

const HomeScreen = () => {
  // State variables for managing posts, loading state, and pagination
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [paused, setPaused] = useState(true);

  // Fetch posts when the component mounts or the page changes
  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  // Function to fetch posts from the backend server
  const fetchPosts = async (currentPage) => {
    setLoading(true);
    const access_token = await AsyncStorage.getItem('access_token');
    try {
      const response = await fetch(`http://192.168.100.82:5000/list?page=${currentPage}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      const result = await response.json();
      setPosts((prevPosts) => [...prevPosts, ...result.posts]); // Append new posts
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
  };

  // Render each individual post item in the list
  const renderPost = ({ item }) => {
     // Initial video state as paused

    // Function to toggle play/pause state of the video
    const togglePlayPause = () => {
      setPaused(!paused);
    };

    return (
      <TouchableOpacity style={styles.postContainer} activeOpacity={1} onPress={togglePlayPause}>
        {/* Render video if available */}
        {item.video_url ? (
          <Video
            source={{ uri: item.video_url }}
            style={styles.video} // Fullscreen video styling
            paused={paused} // Toggle play/pause state
            repeat={true} // Repeat video like TikTok
            resizeMode='cover' // Cover entire screen
            ignoreSilentSwitch='obey' // Obey device silent switch
          />
        ) : (
          // If no video, display a text message
          <Text style={styles.text}>No Video Available</Text>
        )}
        {/* Overlay with post content and interaction icons */}
        <View style={styles.overlay}>
          <Text style={styles.text}>{item.content || 'No description'}</Text>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name='heart' size={30} color='white' />
              <Text style={styles.iconText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name='comment' size={30} color='white' />
              <Text style={styles.iconText}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name='share' size={30} color='white' />
              <Text style={styles.iconText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Display loading indicator while posts are being fetched */}
      {loading ? (
        <ActivityIndicator size='large' color='#ffffff' style={styles.loading} />
      ) : (
        // FlatList for rendering the list of posts
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()} // Use post ID as the unique key
          pagingEnabled={true} // Enable paging for smooth scrolling
          snapToAlignment='start' // Align to start for snap effect
          snapToInterval={height} // Snap interval equal to screen height
          decelerationRate='fast' // Fast deceleration for smooth snapping
          showsVerticalScrollIndicator={false} // Hide vertical scroll indicator
          scrollEnabled={true} // Enable scrolling
          contentContainerStyle={{ flexGrow: 1 }} // Flex grow to occupy the full height
          getItemLayout={(data, index) => ({ length: height, offset: height * index, index })} // Precompute item layout
          onEndReached={() => setPage((prevPage) => prevPage + 1)} // Load more posts when reaching the end
          onEndReachedThreshold={0.5} // Trigger onEndReached when 50% away from bottom
        />
      )}
    </View>
  );
};

// Styles for the HomeScreen component and its child elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for fullscreen video effect
  },
  postContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Black background for fullscreen effect
  },
  video: {
    width: width, // Fullscreen width
    height: height, // Fullscreen height
    position: 'absolute', // Absolute position to fill container
    top: 0, // Align to the top of the screen
    left: 0, // Align to the left of the screen
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  rightIcons: {
    alignItems: 'center',
  },
  iconButton: {
    marginBottom: 20,
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  loading: {
    position: 'absolute',
    top: height / 2 - 20,
    left: width / 2 - 20,
  },
});

export default HomeScreen;
