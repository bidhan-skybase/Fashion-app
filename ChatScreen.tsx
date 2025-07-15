import {View, Text, TextInput, Button, FlatList, StyleSheet} from 'react-native';
import {supabase} from './utils/supabase';
import {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {Session} from '@supabase/supabase-js';
import {GoogleGenAI} from "@google/genai";

// Define a type for chat messages
interface ChatMessage {
    id: number;
    text: string;
    isUser: boolean;
}

// Define a type for fashion profile
interface FashionProfile {
    style: string;
    bio: string;
    bottom_size: string;
    top_size: string;
    gender: string;
    skin_tone: string;
}

const ChatScreen = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [fashionProfile, setFashionProfile] = useState<FashionProfile | null>(null);
    const navigation = useNavigation();
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        // Get session once on mount
        supabase.auth.getSession().then(({data: {session}}) => {
            setSession(session);
        });

        // Listen to session changes (optional)
        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);
    useEffect(() => {
        const fetchProfile = async () => {
            if (session?.user.id) {
                const {data, error} = await supabase
                    .from('profiles')
                    .select('style, bio, bottom_size, top_size, gender, skin_tone')
                    .eq('id', session.user.id)
                    .single();
                if (error) console.error('Failed to fetch profile:', error.message);
                else setFashionProfile(data || null);
            }
        };
        fetchProfile();
    }, [session?.user.id]);

    const handleSend =async () => {
        if (!inputText.trim()) return;

        const userMessage: ChatMessage = {id: Date.now(), text: inputText, isUser: true};
        setMessages((prev) => [...prev, userMessage]);
        setInputText('');

        const prompt = "" +
            `The user's major style is ${fashionProfile?.style}, their bottom size and top size is ${fashionProfile?.bottom_size} and ${fashionProfile?.top_size}. Their gender is ${fashionProfile?.gender} and their skin tone is ${fashionProfile?.skin_tone}. Based on the user input ${inputText} suggest them an outfit. Keep the response very very short.`
        try {
            const ai = new GoogleGenAI({
                apiKey: "AIzaSyAPioEgdNBjVVS8br54PaGW4k1qLPmBtUk"
            });


            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            const recommendation = response.text;
            const aiMessage: ChatMessage = {id: Date.now() + 1, text: recommendation, isUser: false};
            setMessages((prev) => [...prev, aiMessage]);

        }catch (error) {
            console.error('Error generating recommendation:', error);
        }

    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Chat with Us</Text>
            <FlatList
                data={messages}
                renderItem={({item}) => (
                    <View style={item.isUser ? styles.userMessage : styles.aiMessage}>
                        <Text style={styles.messageText}>{item.text}</Text>
                    </View>
                )}
                keyExtractor={(item) => item.id.toString()}
                style={styles.chatContainer}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your style question..."
                />
                <Button title="Send" onPress={handleSend}/>
            </View>
        </View>
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
    chatContainer: {
        flex: 1,
        marginBottom: 16,
    },
    userMessage: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        marginVertical: 4,
        alignSelf: 'flex-end',
        maxWidth: '70%',
    },
    aiMessage: {
        backgroundColor: '#6a9abd',
        padding: 12,
        borderRadius: 8,
        marginVertical: 4,
        alignSelf: 'flex-start',
        maxWidth: '70%',
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginRight: 8,
    },
});

export default ChatScreen;
