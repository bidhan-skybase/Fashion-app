import React, { useState, useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './utils/supabase';

import AuthScreen from './Auth';
import ProfileSetupPage from './ProfileSetup';
import HomeScreen from './Home'; // Assume you have one

const Stack = createNativeStackNavigator();

const App = () => {
    const [user, setUser] = useState<any>(null);
    const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const userData = session?.user ?? null;
            setUser(userData);

            if (userData) {
                await checkProfile(userData.id);
            }

            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    await checkProfile(currentUser.id);
                } else {
                    setProfileCompleted(null);
                }

                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const checkProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('profile_completed')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Failed to fetch user profile:', error);
            setProfileCompleted(false);
        } else {
            setProfileCompleted(data.profile_completed);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: true }}>
                {!user ? (
                    <Stack.Screen name="Auth" component={AuthScreen} />
                ) : profileCompleted ? (
                    <Stack.Screen name="Home" component={HomeScreen} />
                ) : (
                    <Stack.Screen name="ProfileSetup" component={ProfileSetupPage} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
