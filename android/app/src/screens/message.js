import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Alert, 
  SafeAreaView, 
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const MessageScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef();
  
  const { recipientId, recipientName, currentUserId } = route.params || {};

  useEffect(() => {
    if (recipientId) {
      fetchConversation();
      const interval = setInterval(fetchConversation, 15000);
      return () => clearInterval(interval);
    } else {
      Alert.alert(
        'Error',
        'Recipient information is missing. Please select a conversation.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [recipientId]);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const fetchConversation = async () => {
    if (!recipientId) return;
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
        await fetchConversation();
      } else {
        if (data.message === 'Receiver not found.') {
          Alert.alert('Error', 'The recipient user was not found. They may have been deleted or deactivated.');
        } else {
          throw new Error(data.message || 'Failed to send message');
        }
      }
    } catch (error) {
      Alert.alert('Error', `Failed to send message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isSentMessage = item.sender_id === currentUserId;
    const profilePicture = isSentMessage ? item.receiver_profile_picture : item.sender_profile_picture;

    return (
      <View style={[styles.messageRow, isSentMessage ? styles.sentMessageRow : styles.receivedMessageRow]}>
        {!isSentMessage && renderAvatar(profilePicture)}
        <View style={styles.messageContentContainer}>
          <View style={[styles.messageBubble, isSentMessage ? styles.sentMessage : styles.receivedMessage]}>
            <Text style={[styles.messageText, isSentMessage ? styles.sentMessageText : styles.receivedMessageText]}>
              {item.content || 'No content'}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No timestamp'}
          </Text>
        </View>
        {isSentMessage && renderAvatar(profilePicture)}
      </View>
    );
  };

  const renderAvatar = (profilePicture) => (
    <View style={styles.avatarContainer}>
      {profilePicture ? (
        <Image source={{ uri: profilePicture }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{recipientName[0]}</Text>
        </View>
      )}
    </View>
  );

  if (!recipientId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No recipient selected. Please choose a conversation.</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 87}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>{recipientName}</Text>
          </View>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.messageList, { paddingBottom: keyboardHeight }]}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        >
          {messages.map((item, index) => renderMessage({ item, index }))}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message"
            placeholderTextColor="#8e8e93"
            editable={!loading}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
            <Text style={styles.sendButtonText}>{loading ? '•••' : '→'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Slightly darker background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#383740',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  recipientInfo: {
    marginLeft: 15,
  },
  recipientName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 10,
  },
  sentMessageRow: {
    justifyContent: 'flex-end',
  },
  receivedMessageRow: {
    justifyContent: 'flex-start',
  },
  messageContentContainer: {
    flexDirection: 'column',
    maxWidth: '75%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 2,
  },
  sentMessage: {
    backgroundColor: '#dcf8c6',
  },
  receivedMessage: {
    backgroundColor: '#fff',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    marginHorizontal: 5,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#075e54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 16,
  },
  sentMessageText: {
    color: '#000',
  },
  receivedMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#383740',
    backgroundColor: '#383740',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    color: '#000',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100, // Limit the height of the input
  },
  sendButton: {
    backgroundColor: '#075e54',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
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
