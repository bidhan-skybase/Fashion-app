import {StyleSheet, Text, TouchableOpacity} from "react-native";
import {useNavigation} from "@react-navigation/native";
import Recommendation from "../models/RecommendationModel";

const RecommendationCard = ({ recommendation }: { recommendation: Recommendation }) => {

    const navigation = useNavigation();
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Recommendation', { id: recommendation.id })}
        >
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                {recommendation.recommendation_text}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1} ellipsizeMode="tail">
                Tap to view details
            </Text>
        </TouchableOpacity>
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
        shadowOffset: { width: 0, height: 2 },
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

export default RecommendationCard;
