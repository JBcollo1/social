// LoginScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    
    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://192.168.100.82:5000/auth/login/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            setLoading(false);

            if (response.ok) {
                await AsyncStorage.setItem('access_token', data.access_token);
                console.log("Login successful", data);
                navigation.navigate("Main");
            } else {
                if (data.message === "User does not exist") {
                    navigation.navigate("Register");
                } else {
                    Alert.alert("Login Failed", data.message || "An error occurred");
                }
            }
        } catch (error) {
            setLoading(false);
            console.error("Error logging in:", error);
            Alert.alert("Login Failed", "An unexpected error occurred. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Login" onPress={handleLogin} />
            <Button
                title="Go to Register"
                onPress={() => navigation.navigate("Register")}
            />
            {loading && <ActivityIndicator size="large" color="#ffffff" />}
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

export default LoginScreen;
