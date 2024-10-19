import React, { useState } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, Modal, SafeAreaView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CommentSection = ({ postId }) => {
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [currentPostComments, setCurrentPostComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const showComments = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`http://192.168.100.82:5000/post/${postId}/comments`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const comments = await response.json();
      setCurrentPostComments(comments);
      setIsCommentsVisible(true);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async () => {
    const access_token = await AsyncStorage.getItem('access_token');
    if (!newComment || newComment.trim() === "") return;

    try {
      const response = await fetch(`http://192.168.100.82:5000/post/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ comment: newComment }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setNewComment(""); // Clear input after submitting
      showComments(); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={showComments}>
        <Text style={styles.showCommentsButton}>Show Comments</Text>
      </TouchableOpacity>

      <Modal visible={isCommentsVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setIsCommentsVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={currentPostComments}
              renderItem={({ item }) => (
                <View style={styles.commentContainer}>
                <View style={styles.commentHeader}>
                  <Image
                    source={item.profile_pic ? { uri: item.profile_pic } : require('../assets/fancy.webp')}
                    style={styles.Picture}
                  />
                  <Text style={styles.username}>{item.username}</Text>
                </View>
                <Text style={styles.commentText}>{item.content}</Text>
              </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              style={styles.commentList}
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={addComment} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  showCommentsButton: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    fontSize: 16,
    color: '#999',
  },
  commentList: {
    flex: 1,
  },
  commentContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  Picture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  commentText: {
    fontSize: 14,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#ee1d52',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CommentSection;
