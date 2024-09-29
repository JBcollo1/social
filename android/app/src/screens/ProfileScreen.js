import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Button, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';  // Adjusted import statement
import DateTimePicker from '@react-native-community/datetimepicker';

const ProfileScreen = () => {
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [profilePicture, setProfilePicture] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch user ID from token and decode it
  useEffect(() => {
    const fetchUserId = async () => {
      const access_token = await AsyncStorage.getItem("access_token");
      if (access_token) {
        try {
          const decodedToken = jwtDecode(access_token);
          setUserId(decodedToken.sub?.id || decodedToken.id);  // Adjust for your JWT structure
        } catch (error) {
          console.error("Failed to decode token:", error);
        }
      }
    };
    fetchUserId();
  }, []);

  // Fetch profile details if userId is available
  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId]);

  // Fetch user profile from the backend
  const fetchProfile = async (userId) => {
    try {
      const response = await fetch(`http://192.168.100.82:5000/profile/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) {
        setProfileExists(false);  // No profile found
        return;
      }
      const data = await response.json();
      setBio(data.bio);
      setLocation(data.location);
      setDateOfBirth(new Date(data.date_of_birth));  // Update to use date object
      setProfilePicture({ uri: data.profile_picture });
      setProfileExists(true);  // Profile found
    } catch (error) {
      setProfileExists(false);
      Alert.alert('Error', error.message || 'Failed to fetch profile.');
    }
  };

  // Open image picker to select profile picture
  const handleImagePick = () => {
    launchImageLibrary({}, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to pick an image.');
      } else if (response.assets && response.assets.length > 0) {
        setProfilePicture(response.assets[0]);
      }
    });
  };

  // Save profile (either create or update)
  const handleSaveProfile = async () => {
    if (profileExists) {
      handleUpdateProfile();
    } else {
      handleCreateProfile();
    }
  };

  // Create a new profile using POST
  const handleCreateProfile = async () => {
    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('location', location);
    formData.append('DOB', dateOfBirth.toISOString().split('T')[0]);  // Format to 'YYYY-MM-DD'
    if (profilePicture) {
      formData.append('profile_picture', {
        uri: profilePicture.uri,
        type: profilePicture.type,
        name: profilePicture.fileName,
      });
    }

    try {
      const response = await fetch(`http://192.168.100.82:5000/profile/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Profile created successfully.');
        setProfileExists(true);
        setIsEditing(false);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile.');
    }
  };

  // Update existing profile using PATCH
  const handleUpdateProfile = async () => {
    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('location', location);
    formData.append('DOB', dateOfBirth.toISOString().split('T')[0]);  // Format to 'YYYY-MM-DD'
    if (profilePicture) {
      formData.append('profile_picture', {
        uri: profilePicture.uri,
        type: profilePicture.type,
        name: profilePicture.fileName,
      });
    }
  
    try {
      const response = await fetch(`http://192.168.100.82:5000/profile/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
        body: formData,
      });
  
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Profile updated successfully.');
        setIsEditing(false);
        fetchProfile(userId);
      } else {
        console.error('Update Error:', data);  // Log the error response
        Alert.alert('Error', data.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Network or Server Error:', error);  // Log the full error
      Alert.alert('Error', 'Failed to update profile.');
    }
  };
  

  // Handle date picker change
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dateOfBirth;
    setShowDatePicker(Platform.OS === 'ios');  // Keep picker open for iOS
    setDateOfBirth(currentDate);
  };

  return (
    <View style={styles.container}>
      {profilePicture && profilePicture.uri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: profilePicture.uri }} style={styles.image} />
          {profileExists && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Text style={styles.title}>Profile</Text>

      {profileExists && !isEditing ? (
        <View style={styles.profileDetails}>
          <Text style={styles.detailText}>Bio: {bio}</Text>
          <Text style={styles.detailText}>Location: {location}</Text>
          <Text style={styles.detailText}>Date of Birth: {dateOfBirth.toISOString().split('T')[0]}</Text>
        </View>
      ) : (
        <>
          <Button title="Select Profile Picture" onPress={handleImagePick} />
          <TextInput
            style={styles.input}
            placeholder="Bio"
            value={bio}
            onChangeText={setBio}
          />
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={location}
            onChangeText={setLocation}
          />

          {/* Date Picker Trigger */}
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerText}>Select Date of Birth: {dateOfBirth.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>

          {/* DateTimePicker Component */}
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}  // Restrict to dates up to today
            />
          )}

          <Button title="Save Profile" onPress={handleSaveProfile} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'black',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    color: 'white',
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    color: 'white',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  editIcon: {
    fontSize: 24,
    color: 'white',
    marginLeft: 8,
  },
  profileDetails: {
    alignItems: 'center',
  },
  detailText: {
    color: 'white',
    fontSize: 16,
    marginVertical: 4,
  },
  datePickerText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default ProfileScreen;
