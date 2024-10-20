import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const MessageScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);
  
  const { recipientId, recipientName, currentUserId } = route.params || {};

  useEffect(() => {
    console.log('Route params:', route.params);
    if (recipientId) {
      fetchConversation();
      const interval = setInterval(fetchConversation, 15000);
      return () => clearInterval(interval);
    } else {
      console.warn('Missing recipientId. Route params:', route.params);
      Alert.alert(
        'Error',
        'Recipient information is missing. Please select a conversation.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [recipientId, navigation, route.params]);

  const fetchConversation = async () => {
    if (!recipientId) {
      console.warn('Attempted to fetch conversation without recipientId');
      return;
    }
    setLoading(true);
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.100.82:5000/conversation/${recipientId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setMessages(data);
      } else {
        throw new Error(data.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      Alert.alert('Error', `Failed to fetch messages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!recipientId || newMessage.trim() === '') return;
    setLoading(true);
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
        setMessages(prevMessages => [...prevMessages, data]);
      } else {
        if (data.message === 'Receiver not found.') {
          Alert.alert('Error', 'The recipient user was not found. They may have been deleted or deactivated.');
        } else {
          throw new Error(data.message || 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', `Failed to send message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    if (!item || typeof item !== 'object') {
      console.error('Invalid message item:', item);
      return null;
    }
    const isSentMessage = item.sender_id === currentUserId;
    return (
      <View
        style={[
          styles.messageBubble,
          isSentMessage ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.content || 'No content'}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'No timestamp'}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (!recipientId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No recipient selected. Please choose a conversation.
        </Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : `message-${index}`)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          editable={!loading}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
          <Text style={styles.sendButtonText}>{loading ? 'Sending...' : 'Send'}</Text>
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
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: 10,
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
    borderTopWidth: 1,
    borderTopColor: '#333',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#ee1d52',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  goBackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MessageScreen;
