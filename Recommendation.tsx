import {View, Text, StyleSheet, ActivityIndicator, Button, ScrollView} from 'react-native';
import { supabase } from './utils/supabase'; // Adjust path based on your setup
import { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import Recommendation from "./models/RecommendationModel";


const RecommendationScreen = () => {
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigation = useNavigation();
    const route = useRoute();
    const { id } = route.params as { id: string }; // Get the recommendation ID from navigation params

    useEffect(() => {
        const fetchRecommendation = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch the specific recommendation by ID
                const { data, error } = await supabase
                    .from('recommendations')
                    .select('*')
                    .eq('id', id)
                    .single(); // Use .single() since we expect one record

                if (error) {
                    console.error('Failed to fetch recommendation:', error.message);
                    setError('Failed to load recommendation details.');
                    setRecommendation(null);
                    return;
                }

                if (!data) {
                    setError('Recommendation not found.');
                    setRecommendation(null);
                    return;
                }

                setRecommendation(data);
            } catch (err) {
                console.error('Unexpected error:', err.message);
                setError('An unexpected error occurred.');
                setRecommendation(null);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendation();
    }, [id]);

    // Check session and redirect to Auth if not logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigation.navigate('Auth');
            }
        };
        checkSession();
    }, [navigation]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading recommendation...</Text>
            </View>
        );
    }

    if (error || !recommendation) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error || 'Recommendation not found.'}</Text>
                <Button
                    title="Go Back"
                    onPress={() => navigation.goBack()}
                />
            </View>
        );
    }

    return (
        <ScrollView>
        <View style={styles.container}>
            <View style={styles.card}>
                {recommendation.recommendation_text && (
                    <Text style={styles.cardDescription}>{recommendation.recommendation_text}</Text>
                )}
                {recommendation.created_at && (
                    <Text style={styles.cardDate}>
                        Created: {new Date(recommendation.created_at).toLocaleDateString()}
                    </Text>
                )}
            </View>
            <Button
                title="Go Back"
                onPress={() => navigation.goBack()}
            />
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
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    cardDate: {
        fontSize: 14,
        color: '#999',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginVertical: 20,
    },
});

export default RecommendationScreen;
