import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [userName, setUserName] = useState("");
    
    const navigation = useNavigation();  // useNavigation hook to navigate between screens

    const handleRegister = async () => {
        try {
            const response = await fetch("http://192.168.100.82:5000/auth/register/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email, 
                    password, 
                    first_name: firstName, 
                    last_name: lastName, 
                    user_name: userName 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                navigation.navigate('Verification', { email }); // Navigate to verification page
            } else {
                alert(data.error || "Registration failed. Please try again.");
                navigation.navigate('Verification')

            }
        } catch (error) {
            console.error("Error registering:", error);
            alert("An unexpected error occurred. Please check your network and try again.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <TextInput 
                style={styles.input} 
                placeholder="First Name" 
                value={firstName} 
                onChangeText={setFirstName} 
            />
            <TextInput 
                style={styles.input} 
                placeholder="Last Name" 
                value={lastName} 
                onChangeText={setLastName} 
            />
            <TextInput 
                style={styles.input} 
                placeholder="Username" 
                value={userName} 
                onChangeText={setUserName} 
            />
            <TextInput 
                style={styles.input} 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none"
            />
            <TextInput 
                style={styles.input} 
                placeholder="Password" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
            />
            <Button title="Register" onPress={handleRegister} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 16,
        backgroundColor: "black",
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
        color: "white",
        textAlign: "center",
    },
    input: {
        height: 40,
        borderColor: "gray",
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
        color: "white",
    },
});

export default RegisterScreen;
