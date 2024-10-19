import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import Header from "../components/Header";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import VerificationScreen from "../screens/verification";
import PostCreationScreen from "../screens/PostCreationScreen";
import Footer from "../services/footer";
import MyProfileScreen from "../screens/myprofile";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator tabBar={props => <Footer {...props} />}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Profile" component={MyProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
    return ( 
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" component={LoginScreen} options={{headerTitle: () => <Header />, headerShown: true}}/>
                <Stack.Screen name="Register" component={RegisterScreen} options={{headerTitle: () => <Header />, headerShown: true}}/>
                <Stack.Screen name="Verification" component={VerificationScreen} options={{headerTitle: () => <Header />, headerShown: true}}/>
                <Stack.Screen name="Main" component={MainTabs} options={{headerShown: false}}/>
                <Stack.Screen 
                    name="Post" 
                    component={PostCreationScreen} 
                    options={({ navigation }) => ({
                        headerTitle: () => <Header />, 
                        headerShown: true,
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={{ color: 'black', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>Cancel</Text>
                            </TouchableOpacity>
                        )
                    })}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
