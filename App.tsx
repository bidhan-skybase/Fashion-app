import React, { useState, useEffect } from 'react';
import {Text, View, ActivityIndicator, TouchableOpacity} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './utils/supabase';

import AuthScreen from './Auth';
import ProfileSetupPage from './ProfileSetup';
import HomeScreen from './Home';
import structuredClone from '@ungap/structured-clone';
import RecommendationScreen from "./Recommendation";
import Home from "./Home";
import ChatScreen from "./ChatScreen";
if (!global.structuredClone) global.structuredClone = structuredClone;

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
            .from('profiles')
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
            <Stack.Navigator
                initialRouteName={user ? (profileCompleted ? 'Home' : 'ProfileSetup') : 'Auth'}
                screenOptions={{ headerShown: true }}
            >
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="ProfileSetup" component={ProfileSetupPage} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen
                    name="Home"
                    component={Home}
                    options={{
                        title: 'Home',
                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() => {
                                    console.log('Action pressed');
                                     supabase.auth.signOut();
                                }}
                                style={{ marginRight: 0 }}
                            >
                                <Text style={{color:"#007AFF"}}>Sign Out</Text>
                            </TouchableOpacity>
                        ),
                    }}
                />
                <Stack.Screen name="Recommendation" component={RecommendationScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
