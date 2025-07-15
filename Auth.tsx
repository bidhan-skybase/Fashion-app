import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { supabase } from './utils/supabase';
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(false);

    useEffect(() => {
        const handleDeepLink = async (url) => {
            if (url && url.includes('auth')) {
                const urlObj = new URL(url);
                const params = new URLSearchParams(urlObj.hash.substring(1));

                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                if (access_token) {
                    try {
                        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token: refresh_token || '',
                        });

                        if (sessionError) {
                            Alert.alert('Error', sessionError.message);
                        } else if (sessionData?.session) {
                            Alert.alert('Success', 'Logged in with Discord!');
                            navigation.navigate('Home');
                        }
                    } catch (error) {
                        // console.error('Deep link auth error:', error);
                    }
                }
            }
        };

        const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink(url);
            }
        });

        return () => {
            linkingSubscription?.remove();
        };
    }, [navigation]);

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
                navigation.navigate('ProfileSetup')
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
                Alert.alert('Error', error.message);
            } else if (data?.session) {
                navigation.navigate('Home');
                Alert.alert('Success', 'Logged in successfully!');
            } else {
                Alert.alert('Error', 'Unexpected error occurred during sign in.');
            }
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDiscordSignIn = async () => {
        setOauthLoading(true);
        try {
            const redirectUrl = Linking.createURL('auth');

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) {
                Alert.alert('Error', error.message);
                return;
            }

            if (!data?.url) {
                Alert.alert('Error', 'No authorization URL received');
                return;
            }

            const result = await WebBrowser.openAuthSessionAsync(
                data.url,
                redirectUrl,
                {
                    showInRecents: false,
                    dismissButtonStyle: 'cancel'
                }
            );

            if (result.type === 'success' && result.url) {
                WebBrowser.dismissBrowser();

                const url = new URL(result.url);
                const params = new URLSearchParams(url.hash.substring(1));

                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                if (access_token) {
                    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                        access_token,
                        refresh_token: refresh_token || '',
                    });

                    if (sessionError) {
                        Alert.alert('Error', sessionError.message);
                    } else if (sessionData?.session) {
                        Alert.alert('Success', 'Logged in with Discord!');
                        navigation.navigate('Home');
                    } else {
                        Alert.alert('Error', 'Failed to create session');
                    }
                } else {
                    Alert.alert('Error', 'No access token received');
                }
            } else if (result.type === 'cancel') {
                Alert.alert('Login Canceled', 'Discord login was canceled.');
            }
        } catch (err) {
            // console.error("Discord sign-in error:", err);
            Alert.alert('Error', 'Something went wrong with Discord login. Please try again.');
        } finally {
            setOauthLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Email/Password Authentication</Text>
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
                disabled={loading || oauthLoading}
                color="#4CAF50"
            />
            <View style={styles.buttonSpacer} />
            <Button
                title={loading ? "Loading..." : "Sign In"}
                onPress={handleSignIn}
                disabled={loading || oauthLoading}
                color="#2196F3"
            />

            <View style={styles.divider}>
                <Text style={styles.dividerText}>OR</Text>
            </View>

            <Button
                title={oauthLoading ? "Connecting to Discord..." : "Sign In with Discord"}
                onPress={handleDiscordSignIn}
                disabled={loading || oauthLoading}
                color="#7289DA"
            />
            {oauthLoading && (
                <ActivityIndicator size="small" color="#0000ff" style={styles.activityIndicator} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 15,
        borderRadius: 8,
        fontSize: 16,
        color: '#333',
    },
    buttonSpacer: {
        height: 10,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        paddingHorizontal: 10,
    },
    activityIndicator: {
        marginTop: 10,
    },
});

export default AuthScreen;
