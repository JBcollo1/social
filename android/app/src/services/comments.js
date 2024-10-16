import React, { useState } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
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
      const result = await response.json();
      if (result && result.comments) {
        setCurrentPostComments(result.comments);
      }
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

      <Modal visible={isCommentsVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <FlatList
            data={currentPostComments}
            renderItem={({ item }) => (
              <View style={styles.commentContainer}>
                <Text>{item.username}: {item.comment}  </Text>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
          <TextInput
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
          />
          <TouchableOpacity onPress={addComment}>
            <Text style={styles.submitCommentButton}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsCommentsVisible(false)}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Styles for CommentSection
});

export default CommentSection;
