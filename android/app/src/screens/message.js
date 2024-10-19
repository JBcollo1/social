import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const MessageScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  
  // Add a check for route.params
  const { recipientId, recipientName, currentUserId } = route.params || {};

  useEffect(() => {
    console.log('Route params:', route.params); // Add this line for debugging
    if (recipientId) {
      fetchConversation();
      const interval = setInterval(fetchConversation, 15000);
      return () => clearInterval(interval);
    } else {
      // Handle the case when recipientId is not available
      console.error('Missing recipientId'); // Add this line for debugging
      Alert.alert('Error', 'Recipient information is missing');
      navigation.goBack(); // Optionally navigate back
    }
  }, [recipientId]);

  // Fetch the conversation between the current user and recipient
  const fetchConversation = async () => {
    if (!recipientId) return;
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.100.82:5000/conversation/${recipientId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data.reverse()); // Show messages in the correct order
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!recipientId || newMessage.trim() === '') return;
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.100.82:5000/message/send/${recipientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await response.json();
      if (response.ok) {
        setNewMessage('');
        fetchConversation(); // Refresh the conversation after sending
      } else {
        Alert.alert('Error', data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Render a single message bubble
  const renderMessage = ({ item }) => {
    console.log('Rendering message:', item); // Add this line for debugging
    if (!item || typeof item !== 'object') {
      console.error('Invalid message item:', item);
      return null;
    }
    return (
      <View
        style={[
          styles.messageBubble,
          item.sender === recipientName ? styles.receivedMessage : styles.sentMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.content || 'No content'}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'No timestamp'}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        inverted // This will keep the newest messages at the bottom
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#ee1d52',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  timestamp: {
    color: '#ddd',
    fontSize: 12,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#111',
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#ee1d52',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MessageScreen;
