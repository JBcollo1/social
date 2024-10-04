import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';


const PostCreationScreen = () => {
    const [text, setText] = useState('');
    const [photo, setPhoto] = useState(null);
    const [video, setVideo] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);
   

    const navigation = useNavigation();
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

    const handlePostSubmit = async () => {
        const access_token = await AsyncStorage.getItem("access_token");
        const formData = new FormData();
        formData.append('content', text);

        // Append photo if it exists
        if (photo) {
            formData.append('photo', {
                uri: photo,
                name: 'photo.jpg',
                type: 'image/jpeg',
            });
        }

        // Append video if it exists
        if (video) {
            formData.append('video', {
                uri: video,
                name: 'video.mp4',
                type: 'video/mp4',
            });
        }

        try {
            const response = await fetch(`http://192.168.100.82:5000/upload/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
                body: formData,
            });
            const result = await response.json();
            // Handle success (e.g., navigate back, show a message)
        } catch (error) {
            console.error("Error submitting post:", error);
        }
    };

    const pickImage = async () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            quality: 1,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.error('ImagePicker Error: ', response.error);
            } else if (response.assets) {
                setPhoto(response.assets[0].uri);
            }
        });
    };

    const pickVideo = async () => {
        const options = {
            mediaType: 'video',
            includeBase64: false,
            quality: 1,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled video picker');
            } else if (response.error) {
                console.error('VideoPicker Error: ', response.error);
            } else if (response.assets) {
                setVideo(response.assets[0].uri);
            }
        });
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="What's on your mind?"
                multiline
                value={text}
                onChangeText={setText}
            />
            <TouchableOpacity onPress={pickImage}>
                <View style={styles.button}>
                    <Button title="Pick an image" />
                </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickVideo}>
                <View style={styles.button}>
                    <Button title="Pick a video" />
                </View>
            </TouchableOpacity>
            {photo && <Image source={{ uri: photo }} style={styles.image} />}
            {video && typeof video === 'string' && <Text>{video.split('/').pop()}</Text>}

            <Button title="Submit Post" onPress={handlePostSubmit} />
        </View>
    );
    
    
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    input: {
        height: 100,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        padding: 8,
    },
    button: {
        marginBottom: 12,
    },
    image: {
        width: '100%',
        height: 200,
        marginVertical: 8,
    },
});

export default PostCreationScreen;
