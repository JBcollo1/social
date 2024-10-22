import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, FlatList, TouchableOpacity, Dimensions, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import {jwtDecode} from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const MyProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const access_token = await AsyncStorage.getItem("access_token");
      if (access_token) {
        try {
          const decodedToken = jwtDecode(access_token);
          setUserId(decodedToken.sub?.id || decodedToken.id);
        } catch (error) {
          console.error("Failed to decode token:", error);
        }
      }
      setIsLoading(false);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchUserPosts();
      fetchLikedPosts();
      fetchFollowerCount();
      fetchFollowingCount();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.100.82:5000/profile/${userId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch('http://192.168.100.82:5000/user/posts', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      setPosts(data);
      
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const fetchLikedPosts = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.100.82:5000/user/liked_posts`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      setLikedPosts(data);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    }
  };

  const fetchFollowerCount = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.100.82:5000/follower-count/${userId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      setFollowerCount(data.count);
    } catch (error) {
      console.error('Error fetching follower count:', error);
    }
  };

  const fetchFollowingCount = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.100.82:5000/following-count/${userId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      setFollowingCount(data.count);
    } catch (error) {
      console.error('Error fetching following count:', error);
    }
  };

  const navigateToProfileDetails = () => {
    navigation.navigate('Profile-2');
  };

  const renderPost = ({ item }) => {
    const isLikedPost = activeTab === 'liked';
    const imageUrl = item.photo_url;
    const videoUrl = item.video_url;
    const username = item.username;

    return (
      <TouchableOpacity 
        style={styles.postContainer}
        onPress={() => setSelectedPost(item)}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.postImage}
          />
        )}
        {videoUrl && (
          <View style={styles.videoPlaceholder}>
            <Text>Video</Text>
          </View>
        )}
        {username && (
          <Text style={styles.postUsername}>{username}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderFullScreenPost = () => {
    if (!selectedPost) return null;

    const imageUrl = selectedPost.photo_url;
    const videoUrl = selectedPost.video_url;

    const togglePlayPause = () => {
      setIsPlaying(!isPlaying);
    };

    return (
      <Modal
        visible={!!selectedPost}
        transparent={false}
        animationType="slide"
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              setSelectedPost(null);
              setIsPlaying(true);
            }}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          {videoUrl && (
            <TouchableOpacity 
              style={styles.videoContainer} 
              onPress={togglePlayPause}
              activeOpacity={1}
            >
              <Video
                ref={videoRef}
                source={{ uri: videoUrl }}
                style={styles.fullScreenVideo}
                resizeMode="contain"
                paused={!isPlaying}
                repeat={true}
                controls={false}
              />
              {!isPlaying && (
                <View style={styles.playButtonOverlay}>
                  <Text style={styles.playButtonText}>▶</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.fullScreenUsername}>{selectedPost.username}</Text>
          <Text style={styles.fullScreenContent}>{selectedPost.content}</Text>
          <Text style={styles.fullScreenLikes}>Likes: {selectedPost.likes}</Text>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={navigateToProfileDetails}>
          <Image
            source={userData?.profile_picture ? { uri: userData.profile_picture } : require('../assets/fancy.webp')}
            style={styles.profilePic}
          />
        </TouchableOpacity>
        <Text style={styles.username}>{userData?.username}</Text>
        <Text style={styles.bio}>{userData?.bio}</Text>
        <View style={styles.followContainer}>
          <View style={styles.followItem}>
            <Text style={styles.followCount}>{followerCount}</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </View>
          <View style={styles.followItem}>
            <Text style={styles.followCount}>{followingCount}</Text>
            <Text style={styles.followLabel}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'posts' && styles.activeTabText
          ]}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
          onPress={() => setActiveTab('liked')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'liked' && styles.activeTabText
          ]}>Liked</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'posts' ? posts : likedPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        scrollEnabled={false}
      />

      {renderFullScreenPost()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#ee1d52',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ee1d52',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#ee1d52',
    fontWeight: 'bold',
  },
  postContainer: {
    width: width / 3,
    height: width / 3,
    marginBottom: 2,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postUsername: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    padding: 2,
    fontSize: 10,
    borderRadius: 3,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
  fullScreenVideo: {
    width: width,
    height: height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
  },
  fullScreenUsername: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  fullScreenContent: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    paddingHorizontal: 20,
  },
  fullScreenLikes: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  videoContainer: {
    width: width,
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 50,
  },
  followContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  followItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  followCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ee1d52',
  },
  followLabel: {
    fontSize: 14,
    color: '#666',
  },
});

export default MyProfileScreen;
