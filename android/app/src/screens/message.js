import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const MessageScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const { recipientId, recipientName } = route.params;

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch('http://192.168.100.82:5000/messages', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      setMessages(data.reverse()); // Reverse to show newest messages at the bottom
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      await fetch(`http://192.168.100.82:5000/message/${recipientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageBubble, item.sender === recipientName ? styles.receivedMessage : styles.sentMessage]}>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        inverted
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
