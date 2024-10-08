import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import Video from 'react-native-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native'; // Import navigation hook
import {jwtDecode} from 'jwt-decode';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null); // Track which video is playing
  const [videoPaused, setVideoPaused] = useState({}); // Track paused state per video
  const [profilePicture, setProfilePicture] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profileExists, setProfileExists] = useState(true);

  const navigation = useNavigation(); // Initialize navigation
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  useEffect(() => {
    const fetchUserId = async () => {
      setLoading(true);
      const access_token = await AsyncStorage.getItem("access_token");
      if (access_token) {
        try {
          const decodedToken = jwtDecode(access_token);
          setUserId(decodedToken.sub?.id || decodedToken.id);
        } catch (error) {
          console.error("Failed to decode token:", error);
        }
      }
      setLoading(false);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId]);

  const fetchProfile = async (userId) => {
    setLoading(true);  // Start loading
    try {
      const response = await fetch(`http://192.168.100.82:5000/profile/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) {
        setProfileExists(false);  // No profile found
        return;
      }
      const data = await response.json();
      setProfilePicture({ uri: data.profile_picture });
      setProfileExists(true);  // Profile found
    } catch (error) {
      setProfileExists(false);
      Alert.alert('Error', error.message || 'Failed to fetch profile.');
    } finally {
      setLoading(false);  // End loading
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

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

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      setPlayingVideoIndex(visibleIndex);
      setVideoPaused((prev) => ({ ...prev, [visibleIndex]: false })); // Reset paused state for the visible video
    }
  }).current;

  const handleVideoPress = (index) => {
    setVideoPaused((prev) => ({ ...prev, [index]: !prev[index] })); // Toggle play/pause on tap
  };

  const renderPost = ({ item, index }) => {
    const isPlaying = index === playingVideoIndex; // Only play video if it matches the playing index
    const paused = videoPaused[index] || !isPlaying; // Respect the manual paused state

    return (
      <TouchableOpacity style={styles.postContainer} activeOpacity={1} onPress={() => handleVideoPress(index)}>
        {item.video_url ? (
          <Video
            source={{ uri: item.video_url }}
            style={styles.video}
            paused={paused} // Use paused state to control playback
            repeat={true}
            resizeMode="cover"
            ignoreSilentSwitch="obey"
            onError={() => console.error('Error loading video at index:', index)}
          />
        )  : item.photo_url ? (
            <Image
              source={{ uri: item.photo_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.text}>No Video or Photo Available</Text>
          )}
        
        <View style={styles.overlay}>
          {/* Profile picture and navigation */}
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.user_id })}>
            <Image
              source={profilePicture ? { uri: profilePicture.uri } : require}
              style={styles.profilePicture}
            />
          </TouchableOpacity>
          
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="heart" size={30} color="white" />
              <Text style={styles.iconText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="comment" size={30} color="white" />
              <Text style={styles.iconText}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="share" size={30} color="white" />
              <Text style={styles.iconText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" style={styles.loading} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          pagingEnabled={true}
          snapToAlignment="start"
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          contentContainerStyle={{ flexGrow: 1 }}
          getItemLayout={(data, index) => ({ length: height, offset: height * index, index })}
          onEndReached={() => setPage((prevPage) => prevPage + 1)}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  postContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 20,
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
