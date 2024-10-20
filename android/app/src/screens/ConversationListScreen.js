import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ConversationListScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();

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

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('MessageScreen', {
        recipientId: item.user_id,
        recipientName: item.username,
      })}
    >
      <View style={styles.conversationHeader}>
        <Text style={styles.recipientName}>{item.username}</Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
      <Text style={styles.lastMessage} numberOfLines={1} ellipsizeMode="tail">
        {item.last_message}
      </Text>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
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
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Conversations</Text>
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item, index) => `conversation-${item.user_id || index}`}
        style={styles.list}
      />
      <Text style={styles.sectionTitle}>All Users</Text>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item, index) => `user-${item.user_id || index}`}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 15,
  },
  list: {
    flex: 1,
  },
  conversationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
