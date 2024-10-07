import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import Video from 'react-native-video'; // For rendering videos
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window'); // Get screen dimensions

const HomeScreen = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts(1);
    }, []);

    const fetchPosts = async (page) => {
        setLoading(true);
        const access_token = await AsyncStorage.getItem("access_token");
        try {
            const response = await fetch(`http://192.168.100.82:5000/list?page=${page}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            });
            const result = await response.json();
            setPosts(result.posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
        setLoading(false);
    };

    const renderPost = ({ item }) => (
        <View style={styles.postContainer}>
            {item.video_url && (
                <Video
                    source={{ uri: item.video_url }}
                    style={styles.video}
                    controls={false}  // Disable video controls to match TikTok's UX
                    repeat={true}      // Repeat the video to loop indefinitely
                    resizeMode="cover" // Cover the entire screen
                />
            )}
            <View style={styles.overlay}>
                <Text style={styles.text}>{item.content || "No description"}</Text>
                <View style={styles.rightIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="heart" size={30} color="white" />
                        <Text style={styles.iconText}>Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="comment" size={30} color="white" />
                        <Text style={styles.iconText}>Comment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="share" size={30} color="white" />
                        <Text style={styles.iconText}>Share</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#000', // Dark background for TikTok-like UI
        },
        postContainer: {
            width: width, // Full screen width
            height: height, // Full screen height
            justifyContent: 'center',
            alignItems: 'center',
        },
        video: {
            width: '100%',
            height: '100%',
        },
        overlay: {
            position: 'absolute',
            bottom: 50,
            left: 20,
            right: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        text: {
            color: 'white',
            fontSize: 16,
            flex: 1,  // Ensures text takes up remaining space
        },
        rightIcons: {
            alignItems: 'center',
        },
        iconButton: {
            marginBottom: 20,
            alignItems: 'center',
        },
        iconText: {
            color: 'white',
            fontSize: 12,
            marginTop: 4,
        },
        loading: {
            position: 'absolute',
            top: height / 2 - 20,
            left: width / 2 - 20,
        },
    });

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#ffffff" style={styles.loading} />
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderPost}
                    keyExtractor={(item) => item.id.toString()}
                    pagingEnabled={true}  // Enables paging scroll like TikTok
                    snapToAlignment="start"  // Align each post to the top of the screen
                    snapToInterval={height}  // Snap each post to the full height of the screen
                    decelerationRate="fast"  // Ensure quick snapping
                    showsVerticalScrollIndicator={false}
                    getItemLayout={(data, index) => ({ length: height, offset: height * index, index })}
                />
            )}
        </View>
    );
};

export default HomeScreen;
