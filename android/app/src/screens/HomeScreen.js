import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import Video from 'react-native-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native'; // Import navigation hook
import {jwtDecode} from 'jwt-decode'; // Fix: Correct the import of jwtDecode

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
  const [hasNextPage, setHasNextPage] = useState(true);

  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [currentPostComments, setCurrentPostComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [likedPosts, setLikedPosts] = useState({}); // To track liked posts

const toggleLike = async (postId) => {
  const access_token = await AsyncStorage.getItem('access_token');
  if (!likedPosts[postId]) {
    // Like the post
    await fetch(`http://192.168.100.82:5000/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    setLikedPosts((prev) => ({ ...prev, [postId]: true }));
  } else {
    // Unlike the post
    await fetch(`http://192.168.100.82:5000/posts/${postId}/unlike`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    setLikedPosts((prev) => ({ ...prev, [postId]: false }));
  }
};




const addComment = async (postId) => {
  const access_token = await AsyncStorage.getItem('access_token');
  if (newComment.trim() === "") return; // Ensure the comment is not empty

  try {
    const response = await fetch(`http://192.168.100.82:5000/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: newComment }),
    });
    const result = await response.json();
    setCurrentPostComments((prevComments) => [...prevComments, result.comment]); // Add new comment to the list
    setNewComment(""); // Clear the input field
  } catch (error) {
    console.error('Error adding comment:', error);
  }
};


const showComments = async (postId) => {
  try {
    const response = await fetch(`http://192.168.100.82:5000/posts/${postId}/comments`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
      },
    });
    const result = await response.json();
    setCurrentPostComments(result.comments);
    setIsCommentsVisible(true);
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
};


  const navigation = useNavigation(); // Initialize navigation
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
      setLoading(false);
    }
  };

  // Fetch posts on page change
  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  // Fetch posts with pagination
  const fetchPosts = async (currentPage) => {
    if (!hasNextPage) return; // Stop fetching if no more pages
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
      setHasNextPage(result.has_next_page); // Update if more pages exist
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
      setVideoPaused((prev) => ({ ...prev, [visibleIndex]: false })); // Reset paused state for the visible video
    }
  }).current;

  // Toggle play/pause on video press
  const handleVideoPress = (index) => {
    setVideoPaused((prev) => ({ ...prev, [index]: !prev[index] })); // Toggle play/pause on tap
  };

  // Render each post
  const renderPost = ({ item, index }) => {
    const isPlaying = index === playingVideoIndex; // Only play video if it matches the playing index
    const paused = videoPaused[index] || !isPlaying; // Respect the manual paused state

    return (
      <View style={styles.postContainer}>
        {/* Profile info, username, and post meta */}
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.user_id })}>
            <Image
              source={ { uri: profilePicture.uri } } // Use the profile picture for each post
              style={styles.profilePicture}
            />
          </TouchableOpacity>
          <Text style={styles.username}>{item.username}</Text>
        </View>

        {/* Media content */}
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

        {/* Interaction icons (like, comment, share) */}
        <View style={styles.interactionRow}>
        <TouchableOpacity
        style={styles.iconButton}
        onPress={() => toggleLike(item.id)}
        >
        <Icon name={likedPosts[item.id] ? "heart" : "heart-o"} size={30} color={likedPosts[item.id] ? "red" : "black"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => showComments(item.id)}>
  <Icon name="comment-o" size={30} color="black" />
</TouchableOpacity>

{/* Comments Modal */}
<Modal
  visible={isCommentsVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setIsCommentsVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      {/* List of comments */}
      <FlatList
        data={currentPostComments}
        renderItem={({ item }) => (
          <View style={styles.commentContainer}>
            <Text style={styles.commentText}>
              <Text style={styles.commentUsername}>{item.username}: </Text>
              {item.content}
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      
      {/* Input field for adding a new comment */}
      <TextInput
        style={styles.input}
        placeholder="Add a comment..."
        value={newComment}
        onChangeText={(text) => setNewComment(text)}
      />

      {/* Submit comment */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => addComment(item.id)}  
      >
        <Text style={styles.submitButtonText}>Post</Text>
      </TouchableOpacity>

      {/* Close button */}
      <TouchableOpacity onPress={() => setIsCommentsVisible(false)} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


          <TouchableOpacity style={styles.iconButton}>
            <Icon name="share-square-o" size={30} color="black" />
          </TouchableOpacity>
        </View>
        

        {/* Caption or description */}
        <Text style={styles.caption}>
          <Text style={styles.username}>{item.username}</Text> {item.caption}
        </Text>
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
