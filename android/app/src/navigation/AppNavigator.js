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
import MessageScreen from "../screens/message";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator tabBar={props => <Footer {...props} />}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Profile" component={MyProfileScreen} />
    <Tab.Screen name="Messages" component={MessageScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
    const defaultScreenOptions = {
        headerTitle: () => <Header />,
        headerShown: true
    };

    return ( 
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName="Login"
                screenOptions={defaultScreenOptions}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Verification" component={VerificationScreen} />
                <Stack.Screen name="Post" component={PostCreationScreen} />
                <Stack.Screen name="Main" component={MainTabs} options={{headerShown: false}}/>
                <Stack.Screen 
                    name="Messages" 
                    component={MessageScreen} 
                    options={({ navigation }) => ({
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
