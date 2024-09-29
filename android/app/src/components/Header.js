import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Social App</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        marginLeft: 69
    },
    title: {
        color: 'black',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default Header;
