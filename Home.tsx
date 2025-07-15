import {Button, ScrollView, Text, View, TouchableOpacity, StyleSheet} from 'react-native';
import {supabase} from './utils/supabase';
import {useEffect, useState} from 'react';
import {Session} from '@supabase/supabase-js';
import {useNavigation} from '@react-navigation/native';
import RecommendationCard from "./components/RecommendationCard";
import Recommendation from "./models/RecommendationModel";


const Home = () => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [session, setUser] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const {data: {session}, error: sessionError} = await supabase.auth.getSession();
                if (sessionError) {
                    console.error('Failed to fetch session:', sessionError.message);
                    setUser(null);
                    setRecommendations([]);
                    navigation.navigate('Auth');
                    return;
                }

                setUser(session);

                if (session?.user.id) {
                    const {data, error} = await supabase
                        .from('recommendations')
                        .select('*')
                        .eq('user_id', session.user.id);

                    if (error) {
                        console.error('Failed to fetch recommendations:', error.message);
                        setRecommendations([]);
                    } else {
                        setRecommendations(data || []);
                    }
                } else {
                    setRecommendations([]);
                    navigation.navigate('Auth');
                }
            } catch (err) {
                console.error('Unexpected error:', err.message);
                setRecommendations([]);
                navigation.navigate('Auth');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigation]);

    useEffect(() => {
        const {data: authListener} = supabase.auth.onAuthStateChange((_event, newSession) => {
            setUser(newSession);
            if (!newSession) {
                navigation.navigate('Auth');
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigation]);

    const handleSignOut = async () => {
        try {
            const {error} = await supabase.auth.signOut();
            if (error) {
                console.error('Sign-out failed:', error.message);
            } else {
                setUser(null);
                setRecommendations([]);
                navigation.navigate('Auth');
            }
        } catch (err) {
            console.error('Unexpected error during sign-out:', err.message);
        }
    };


    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View>
                {session ? (
                    <>
                        <Text style={styles.welcome}>Welcome, {session.user.email}</Text>
                        {recommendations.length > 0 ? (
                            recommendations.map((rec) => (
                                <RecommendationCard key={rec.id} recommendation={rec}/>
                            ))
                        ) : (
                            <Text style={styles.noData}>No recommendations found.</Text>
                        )}

                    </>
                ) : (
                    <Text style={styles.noData}>Not logged in.</Text>
                )}

                <Button title={"Chat with us"} onPress={()=>{
                    navigation.navigate("Chat")
                }}></Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    welcome: {
        fontSize: 18,
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    noData: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 20,
    },
});

export default Home;
