import React, {useState} from 'react';
import {View, TextInput, Button, Alert, StyleSheet} from 'react-native';
import {supabase} from './utils/supabase';
import {useNavigation} from "@react-navigation/native";

const AuthScreen = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const {data, error} = await supabase.auth.signUp({
                email,
                password,
            });
            console.log(data);

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Success', 'Account created! Check your email for verification.');
            }
        } catch (error) {
            Alert.alert('Error');
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("Sign-in error:", error.message);
                Alert.alert('Error', error.message);
            } else if (data?.session) {
                console.log("Logged in:", data);
                Alert.alert('Success', 'Logged in successfully!');
            } else {
                Alert.alert('Error', 'Unexpected error occurred.');
            }
        } catch (err) {
            console.error("Unexpected sign-in error:", err);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <View style={styles.container}>
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
            <Button
                title={loading ? "Loading..." : "Sign Up"}
                onPress={handleSignUp}
                disabled={loading}
            />
            <Button
                title={loading ? "Loading..." : "Sign In"}
                onPress={handleSignIn}
                disabled={loading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 15,
        marginBottom: 15,
        borderRadius: 5,
    },
});

export default AuthScreen;
