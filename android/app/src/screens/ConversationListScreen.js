import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ConversationListScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('conversations');
  const navigation = useNavigation();
  const [followStatus, setFollowStatus] = useState({});

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  const fetchConversations = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch('http://192.168.100.82:5000/conversations', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setConversations(data);
      } else {
        console.error('Failed to fetch conversations:', data.message);
        Alert.alert('Error', 'Failed to fetch conversations. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert('Error', 'An error occurred while fetching conversations. Please try again.');
    }
  };

  const fetchUsers = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch('http://192.168.100.82:5000/users', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        console.error('Failed to fetch users:', data.message);
        Alert.alert('Error', 'Failed to fetch users. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'An error occurred while fetching users. Please try again.');
    }
  };

  const toggleFollow = async (userId) => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const isFollowing = followStatus[userId];
      const url = isFollowing
        ? `http://192.168.100.82:5000/unfollow/${userId}`
        : `http://192.168.100.82:5000/follow/${userId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setFollowStatus(prev => ({ ...prev, [userId]: !isFollowing }));
        Alert.alert('Success', data.message);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  };

  const fetchFollowStatus = async (userId) => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.100.82:5000/follow-status/${userId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setFollowStatus(prev => ({ ...prev, [userId]: data.is_following }));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      users.forEach(user => fetchFollowStatus(user.user_id));
    }
  }, [users, activeTab]);

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('MessageScreen', {
        recipientId: item.user_id,
        recipientName: item.username,
      })}
    >
      <View style={styles.conversationContent}>
        {item.picture && (
          <Image source={{ uri: item.picture }} style={styles.profilePicture} />
        )}
        <View style={styles.conversationDetails}>
          <View style={styles.conversationHeader}>
            <Text style={styles.recipientName}>{item.username}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1} ellipsizeMode="tail">
            {item.last_message}
          </Text>
        </View>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => navigation.navigate('MessageScreen', {
          recipientId: item.user_id,
          recipientName: item.username,
        })}
      >
        {item.profile_picture && (
          <Image source={{ uri: item.profile_picture }} style={styles.profilePicture} />
        )}
        <Text style={styles.username}>{item.username}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.followButton, followStatus[item.user_id] && styles.followingButton]}
        onPress={() => toggleFollow(item.user_id)}
      >
        <Text style={styles.followButtonText}>
          {followStatus[item.user_id] ? 'Unfollow' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'conversations' && styles.activeTab]}
          onPress={() => setActiveTab('conversations')}
        >
          <Text style={[styles.tabText, activeTab === 'conversations' && styles.activeTabText]}>Conversations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'conversations' ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item, index) => `conversation-${item.user_id || index}`}
          style={styles.list}
        />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item, index) => `user-${item.user_id || index}`}
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a', // Lighter background color
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  conversationContent: {
    flexDirection: 'row',
    flex: 1,
  },
  conversationDetails: {
    flex: 1,
    marginLeft: 15,
  },
  recipientName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastMessage: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#333',
  },
  followButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  username: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ConversationListScreen;
