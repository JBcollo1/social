import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import Header from "../components/Header";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import VerificationScreen from "../screens/verification";
 
const Stack = createStackNavigator();

const AppNavigator = () => {
    return ( 
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Login" component={LoginScreen} options={{headerTitle: () => <Header />, headerShown:true}}/>
                <Stack.Screen name="Home" component={HomeScreen} options={{
                        headerTitle: () => <Header />, 
                        headerShown: true,
                    }}/>
                <Stack.Screen name="Profile" component={ProfileScreen} options={{headerTitle: () => <Header />, headerShown:true}}/>
                <Stack.Screen name="Register" component={RegisterScreen} options={{headerTitle: () => <Header />, headerShown:true}}/>
                <Stack.Screen name="Verification" component={VerificationScreen} options={{headerTitle: () => <Header />, headerShown:true}}/>


            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
