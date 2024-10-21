import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
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
  const [expandedContent, setExpandedContent] = useState({});
  const [conversations, setConversations] = useState([]);

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
      const response = await fetch(`http://192.168.100.82:5000/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Check if data is an array and take the first item
      const userData = Array.isArray(data) ? data[0] : data;

      if (userData && userData.profile_picture) {
        setProfilePicture( userData.profile_picture );
        setName(userData.username);
        setProfileExists(true);
        console.log("Profile data:", userData);
        console.log(profilePicture);
        console.log(name);
      } else {
        throw new Error("Invalid user data received");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfileExists(false);
      setProfilePicture(null);
      setName("");
      Alert.alert('Error', 'Failed to fetch profile. Please try again later.');
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

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('http://192.168.100.82:5000/conversations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('access_token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  const toggleContentExpansion = (postId) => {
    setExpandedContent(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Render each post
  const renderPost = ({ item, index }) => {
    const isPlaying = index === playingVideoIndex;
    const paused = videoPaused[index] || !isPlaying;
    const isExpanded = expandedContent[item.id];

    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.user_id })}>
            <Image
              source={{ uri: item.profile_picture || 'https://example.com/default.jpg' }}
              style={styles.profilePicture}
            />
          </TouchableOpacity>
          <Text style={styles.username}>{item.username || 'Unknown User'}</Text>
        </View>

        <TouchableOpacity activeOpacity={1} onPress={() => handleVideoPress(index)}>
          {item.video_url ? (
            <Video
              source={{ uri: item.video_url }}
              style={styles.media}
              paused={paused}
              repeat={true}
              resizeMode="cover"
              ignoreSilentSwitch="obey"
              onError={() => console.error('Error loading video at index:', index)}
            />
          ) : item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.media} resizeMode="cover" />
          ) : (
            <View style={styles.noMediaContainer}>
              <Text style={styles.noMediaText}>No Media Available</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.interactionRow}>
          <LikeButton postId={item.id} />
          <CommentSection postId={item.id} />
        </View>
        
        <View style={styles.captionContainer}>
          <Text style={styles.captionText} numberOfLines={isExpanded ? undefined : 2}>
            <Text style={styles.captionUsername}>{item.username || 'Unknown User'}</Text>
            {item.content ? ` ${item.content}` : ' No caption available.'}
          </Text>
          {item.content && item.content.length > 100 && (
            <TouchableOpacity onPress={() => toggleContentExpansion(item.id)}>
              <Text style={styles.readMoreText}>{isExpanded ? 'Show less' : 'Read more'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal style={styles.conversationsContainer} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.conversationItem}
          onPress={() => navigation.navigate('Profile', { userId: userId })}
        >
          <Image 
            source={{uri:profilePicture} || { uri: 'https://example.com/default.jpg' }} 
            style={styles.conversationProfilePic} 
          />
        </TouchableOpacity>
        {conversations.map(conv => (
          <TouchableOpacity 
            key={conv.id} 
            style={styles.conversationItem}
            onPress={() => navigation.navigate('Chat', { conversationId: conv.id, recipientName: conv.recipient_name })}
          >
            <Image 
              source={{ uri: conv.recipient_profile_picture || 'https://example.com/default.jpg' }} 
              style={styles.conversationProfilePic} 
            />
            {conv.unread_messages > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{conv.unread_messages}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={styles.loading} />
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
    backgroundColor: '#121212', // Darker background
  },
  conversationsContainer: {
    height: 100,
    backgroundColor: '#1e1e1e',
    paddingVertical: 10,
  },
  conversationItem: {
    marginHorizontal: 5,
    position: 'relative',
  },
  conversationProfilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e1306c',
  },
  unreadBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#e1306c',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postContainer: {
    width: width,
    height: height,
    backgroundColor: '#1e1e1e',
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
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  media: {
    width: width,
    height: width,
    backgroundColor: '#2c2c2c',
  },
  noMediaContainer: {
    width: width,
    height: width,
    backgroundColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMediaText: {
    fontSize: 16,
    color: '#ffffff',
  },
  interactionRow: {
    flexDirection: 'row',
    padding: 10,
  },
  captionContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  captionText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '600',
  },
  readMoreText: {
    color: '#8e8e8e',
    marginTop: 5,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
