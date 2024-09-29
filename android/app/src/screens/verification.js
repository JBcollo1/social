import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VerificationScreen = ({ navigation, route }) => {
    const [verificationCode, setVerificationCode] = useState('');
    const [storedEmail, setStoredEmail] = useState('');

    useEffect(() => {
        // Load email from AsyncStorage if it exists
        const loadEmail = async () => {
            try {
                const email = await AsyncStorage.getItem('email');
                if (email !== null) {
                    setStoredEmail(email);
                } else if (route.params?.email) {
                    setStoredEmail(route.params.email);
                    await AsyncStorage.setItem('email', route.params.email);
                }
            } catch (error) {
                console.error("Error loading email from AsyncStorage:", error);
            }
        };

        loadEmail();
    }, [route.params?.email]);

    const handleVerifyCode = async () => {
        try {
            const response = await fetch("http://192.168.100.82:5000/auth/verify/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: storedEmail,
                    verification_code: verificationCode,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", data.message);
                // Navigate to Login or another screen after verification
                navigation.navigate('Login');
                await AsyncStorage.removeItem('email'); // Optionally clear email after success
            } else {
                Alert.alert("Error", data.error || "Verification failed. Please try again.");
            }
        } catch (error) {
            console.error("Error verifying code:", error);
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        }
    };

    const handleResendCode = async () => {
        try {
            const response = await fetch("http://192.168.100.82:5000/auth/resend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: storedEmail,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "A new verification code has been sent to your email.");
            } else {
                Alert.alert("Error", data.error || "Failed to resend verification code.");
            }
        } catch (error) {
            console.error("Error resending code:", error);
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
            <Text style={{ color: 'white' }}>Enter Verification Code</Text>
            <TextInput
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="Verification Code"
                placeholderTextColor="gray"
                style={{ borderWidth: 1, width: '80%', padding: 10, marginVertical: 20, color: 'white', borderColor: 'white' }}
            />
            <Button title="Verify" onPress={handleVerifyCode} />
            <Button title="Resend Code" onPress={handleResendCode} />
        </View>
    );
};

export default VerificationScreen;
