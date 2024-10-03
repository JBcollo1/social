import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Image, Button, StyleSheet,
  Alert, TouchableOpacity, ActivityIndicator, Platform
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';  // Import Ionicons for the edit icon
import RNPickerSelect from 'react-native-picker-select';


const ProfileScreen = () => {
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [profilePicture, setProfilePicture] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(dateOfBirth.getFullYear());

  // Fetch user ID from token and decode it
  useEffect(() => {
    const fetchUserId = async () => {
      setLoading(true);
      const access_token = await AsyncStorage.getItem("access_token");
      if (access_token) {
        try {
          const decodedToken = jwtDecode(access_token);
          setUserId(decodedToken.sub?.id || decodedToken.id);  // Adjust for your JWT structure
        } catch (error) {
          console.error("Failed to decode token:", error);
        }
      }
      setLoading(false);
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
    setLoading(true);  // Start loading
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
    } finally {
      setLoading(false);  // End loading
    }
  };

  // Open image picker to select profile picture
  const handleImagePick = () => {
    if (isEditing) {  // Only allow image pick when editing is enabled
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
    }
  };
  const years = Array.from(
    { length: new Date().getFullYear() - 1900 },
    (_, i) => ({ label: `${new Date().getFullYear() - i}`, value: new Date().getFullYear() - i })
  );
  // Save profile (either create or update)
  const handleSaveProfile = async () => {
    setLoading(true);  // Start loading
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
        type: profilePicture.type || 'image/jpeg',  // Default to image/jpeg
        name: profilePicture.fileName || 'profile.jpg',  // Default file name
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
    } finally {
      setLoading(false);  // End loading
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
        type: profilePicture.type || 'image/jpeg',
        name: profilePicture.fileName || 'profile.jpg',
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
        Alert.alert('Error', data.message || 'Failed to update profile.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);  // End loading
    }
  };
  const handleYearChange = (year) => {
    const newDate = new Date(dateOfBirth);
    newDate.setFullYear(year);
    setDateOfBirth(newDate);
    setSelectedYear(year);
  };
  // Handle date picker change
  const handleDateChange = (event, selectedDate) => {
    if (isEditing) {  // Only update date when editing is enabled
      const currentDate = selectedDate || dateOfBirth;
      setShowDatePicker(Platform.OS === 'ios');  // Keep picker open for iOS
      setDateOfBirth(currentDate);
    }
  };
  const pickerSelectStyles = {
    inputIOS: {
      color: 'black',
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      marginBottom: 15,
    },
    inputAndroid: {
      color: 'black',
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      marginBottom: 15,
    },}

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Profile</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editIcon}>
          <Icon name={isEditing ? "checkmark" : "pencil"} size={24} color="black" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
        {profilePicture ? (
          <Image source={{ uri: profilePicture.uri }} style={styles.profileImage} />
        ) : (
          <Text style={styles.blackText}>Pick a Profile Picture</Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={[styles.input, styles.blackText]}
        placeholder="Bio"
        placeholderTextColor="black"
        value={bio}
        onChangeText={setBio}
        editable={isEditing}  // Make editable only when in edit mode
      />
      <TextInput
        style={[styles.input, styles.blackText]}
        placeholder="Location"
        placeholderTextColor="black"
        value={location}
        onChangeText={setLocation}
        editable={isEditing}  // Make editable only when in edit mode
      />
    <TouchableOpacity onPress={() => isEditing && setShowDatePicker(true)}>
  {isEditing && ( // Conditional rendering for editing mode
    <>
      <Text style={styles.label}>Select Year:</Text>
      <RNPickerSelect
        onValueChange={(value) => handleYearChange(value)}
        items={years}
        value={selectedYear}
        placeholder={{ label: 'Select Year', value: null }}
        style={pickerSelectStyles}
      />
    </>
  )}
  
  <Text style={[styles.dateText, styles.blackText]}>
    Date of Birth: {dateOfBirth.toDateString()}
  </Text>
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={dateOfBirth}
    mode="date"
    display="default"
    onChange={handleDateChange}
    maximumDate={new Date(new Date().getFullYear() - 1, 11, 31)}
  />
)}

     
      {isEditing && <Button title="Save Profile" onPress={handleSaveProfile} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color:'black',
  },
  editIcon: {
    padding: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  imagePicker: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 80,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    marginBottom: 20,
  },
  blackText: {
    color: 'black',
  },
  label: {
    fontSize: 16,         // Font size
    fontWeight: 'bold',   // Font weight
    color: '#333',        // Text color
    marginBottom: 8,      // Space below the label
  },
});

export default ProfileScreen;
