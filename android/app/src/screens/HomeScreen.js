import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator, TouchableOpacity, Image,A } from 'react-native';
import Video from 'react-native-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; 
import { jwtDecode } from 'jwt-decode'; 
import CommentSection from '../services/comments';
import LikeButton from '../services/like';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null);
  const [videoPaused, setVideoPaused] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profileExists, setProfileExists] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [name, setName] = useState("");

  const navigation = useNavigation();
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  // Fetch user ID from token
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

  // Fetch profile once userId is available
  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId]);

  // Fetch user profile
  const fetchProfile = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://192.168.100.82:5000/profile/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) {
        setProfileExists(false);  
        return;
      }
      const data = await response.json();
      setProfilePicture({ uri: data.profile_picture });
      setName(data.username);
      setProfileExists(true);  
    } catch (error) {
      setProfileExists(false);
      Alert.alert('Error', error.message || 'Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts on page change
  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  // Fetch posts with pagination
  const fetchPosts = async (currentPage) => {
    if (!hasNextPage) return; 
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
      setPosts((prevPosts) => [...prevPosts, ...result.posts]);
      setHasNextPage(result.has_next_page);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
  };

  // Handle visible video
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      setPlayingVideoIndex(visibleIndex);
      setVideoPaused((prev) => ({ ...prev, [visibleIndex]: false }));
    }
  }).current;

  // Toggle play/pause on video press
  const handleVideoPress = (index) => {
    setVideoPaused((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Render each post
  // In the renderPost function
const renderPost = ({ item, index }) => {
  const isPlaying = index === playingVideoIndex;
  const paused = videoPaused[index] || !isPlaying;

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.user_id })}>
          <Image
            source={
              profilePicture 
                ? { uri: profilePicture.uri } 
                : { uri: 'https://media.istockphoto.com/id/1263886253/photo/financial-graphic-on-a-high-tech-abstract-background.jpg?s=612x612&w=0&k=20&c=Ru7e67lWBzT4ifiKN8IPcCE_3WKmwRwVMpvj99GxXHg=' } 
            }
            style={styles.profilePicture}
          />
        </TouchableOpacity>
        <Text style={styles.username}>{name || 'Unknown User'}</Text>
      </View>

      <TouchableOpacity activeOpacity={1} onPress={() => handleVideoPress(index)}>
        {item.video_url ? (
          <Video
            source={{ uri: item.video_url }}
            style={styles.video}
            paused={paused}
            repeat={true}
            resizeMode="cover"
            ignoreSilentSwitch="obey"
            onError={() => console.error('Error loading video at index:', index)}
          />
        ) : item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.text}>No Video or Photo Available</Text>
        )}
      </TouchableOpacity>

      <View style={styles.interactionRow}>
        <LikeButton postId={item.id} />
        <CommentSection postId={item.id} />
      </View>
      
      <View style={styles.captionContainer}>
        <View style={styles.captionProfilePictureContainer}>
          <Image
            source={item.profile_picture ? { uri: item.profile_picture } : require('../assets/fancy.webp')}
            style={styles.captionProfilePicture}
          />
        </View>
        <Text style={styles.captionText}>
          <Text style={styles.username}>{item.username || 'Unknown User'}</Text>
          {item.content ? ` ${item.content}` : ' No caption available.'}
        </Text>
      </View>
    </View>
  );
};

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loading} />
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
    backgroundColor: '#fff',
  },
  postContainer: {
    width: width,
    height: height,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  captionProfilePictureContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: 10,
  },
  captionProfilePicture: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  captionText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  video: {
    width: width,
    height: height * 0.6,
  },
  image: {
    width: width,
    height: height * 0.6,
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 10,
  },
  iconButton: {
    marginRight: 20,
  },
  caption: {
    paddingHorizontal: 10,
    color: '#000',
  },
  text: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
  },
  loading: {
    position: 'absolute',
    top: height / 2 - 20,
    left: width / 2 - 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    maxHeight: '80%',
  },
  commentContainer: {
    paddingVertical: 10,
  },
  commentText: {
    fontSize: 14,
    color: '#000',
  },
  commentUsername: {
    fontWeight: 'bold',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 10,
    fontSize: 16,
    height:40,
    color:'black',
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#00f',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'blue',
    fontSize: 16,
  },
});

export default HomeScreen;
