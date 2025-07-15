import React, {useEffect, useState} from 'react';
import {
    View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import {supabase} from './utils/supabase';
import {useNavigation} from '@react-navigation/native';
import {Session} from '@supabase/supabase-js';
import {GoogleGenAI} from '@google/genai';

// --- Types
interface ChatMessage {
    id: number;
    text: string;
    isUser: boolean;
}

interface FashionProfile {
    style: string;
    bio: string;
    bottom_size: string;
    top_size: string;
    gender: string;
    skin_tone: string;
    body_shape?: string;
    height?: string;
}

const quickSuggestions = [
    'Outfit for a Date',
    'Summer Styles',
    'Tropical Travel',
    'Try this shirt',
];

const ChatScreen = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [fashionProfile, setFashionProfile] = useState<FashionProfile | null>(null);
    const [guidedStep, setGuidedStep] = useState<'ask-body' | 'ask-height' | 'ask-skin' | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const navigation = useNavigation();

    // Fetch session
    useEffect(() => {
        supabase.auth.getSession().then(({data: {session}}) => setSession(session));
        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Fetch fashion profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (session?.user.id) {
                const {data, error} = await supabase
                    .from('profiles')
                    .select('style, bio, bottom_size, top_size, gender, skin_tone, body_shape, height')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Failed to fetch profile:', error.message);
                } else {
                    setFashionProfile(data || null);
                    if (!data?.body_shape || !data?.height || !data?.skin_tone) {
                        startGuidedProfileQuestions();
                    }
                }
            }
        };
        fetchProfile();
    }, [session?.user.id]);

    const startGuidedProfileQuestions = () => {
        setMessages([
            {
                id: Date.now(),
                text: "Hi! Let's complete your style profile for better suggestions 😊",
                isUser: false,
            },
            {
                id: Date.now() + 1,
                text: "First, what's your body shape? (e.g., slim, athletic, round, etc.)",
                isUser: false,
            },
        ]);
        setGuidedStep('ask-body');
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage: ChatMessage = {id: Date.now(), text: inputText, isUser: true};
        setMessages((prev) => [...prev, userMessage]);

        // Handle guided setup
        if (guidedStep) {
            let nextStep: typeof guidedStep | null = null;

            if (guidedStep === 'ask-body') {
                await supabase.from('profiles').update({body_shape: inputText}).eq('id', session?.user.id);
                nextStep = 'ask-height';
                setMessages(prev => [...prev, {
                    id: Date.now() + 2,
                    text: "Great! Now, what's your height? (e.g., 5'8\" or 172cm)",
                    isUser: false,
                }]);
            } else if (guidedStep === 'ask-height') {
                await supabase.from('profiles').update({height: inputText}).eq('id', session?.user.id);
                nextStep = 'ask-skin';
                setMessages(prev => [...prev, {
                    id: Date.now() + 3,
                    text: "Thanks! Finally, what's your skin tone? (fair, medium, dark)",
                    isUser: false,
                }]);
            } else if (guidedStep === 'ask-skin') {
                await supabase.from('profiles').update({skin_tone: inputText}).eq('id', session?.user.id);
                setMessages(prev => [...prev, {
                    id: Date.now() + 4,
                    text: "Awesome! You're all set. Ask me anything about outfits now 👗👕",
                    isUser: false,
                }]);
                nextStep = null;
            }

            setGuidedStep(nextStep);
            setInputText('');
            return;
        }

        // Send to Gemini only if profile is ready
        if (
            fashionProfile?.style &&
            fashionProfile?.top_size &&
            fashionProfile?.bottom_size &&
            fashionProfile?.gender
        ) {
            const prompt = `
      The user's style is ${fashionProfile.style}, sizes are ${fashionProfile.top_size} (top) and ${fashionProfile.bottom_size} (bottom).
      Gender: ${fashionProfile.gender}, Skin tone: ${fashionProfile.skin_tone}. Bio: ${fashionProfile.bio}
      User said: "${inputText}". Suggest a short outfit idea.
      `;

            try {
                const ai = new GoogleGenAI({apiKey: 'AIzaSyAPioEgdNBjVVS8br54PaGW4k1qLPmBtUk'});
                const result = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                const recommendation = result.text;
                if (session?.user?.id) {
                    const {error} = await supabase.from('recommendations').insert({
                        user_id: session.user.id,
                        recommendation_text: recommendation,
                    });

                    if (error) {
                        console.error('Failed to save recommendation:', error.message);
                    }
                }


                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: recommendation || 'Sorry, I couldn’t think of anything right now.',
                    isUser: false,
                }]);
            } catch (error) {
                console.error('Gemini error:', error);
            }
        } else {
            const missingFields = [];

            if (!fashionProfile?.style) missingFields.push('style');
            if (!fashionProfile?.top_size) missingFields.push('top size');
            if (!fashionProfile?.bottom_size) missingFields.push('bottom size');
            if (!fashionProfile?.gender) missingFields.push('gender');
            if (!fashionProfile?.skin_tone) missingFields.push('skin tone');

            const message = `Please complete your profile first. Missing: ${missingFields.join(', ')}.`;

            setMessages(prev => [...prev, {
                id: Date.now() + 10,
                text: message,
                isUser: false,
            }]);
        }

        setInputText('');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <Text style={styles.header}>Fashion Chat</Text>

            {/* Quick Suggestions */}
            {messages.length === 0 && (
                <FlatList
                    data={quickSuggestions}
                    keyExtractor={(item) => item}
                    horizontal
                    contentContainerStyle={styles.suggestionList}
                    renderItem={({item}) => (
                        <TouchableOpacity
                            onPress={() => setInputText(item)}
                            style={styles.suggestionChip}
                        >
                            <Text style={styles.suggestionText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Chat Messages */}
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

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Ask your fashion question..."
                />
                <Button title="Send" onPress={handleSend}/>
            </View>
        </KeyboardAvoidingView>
    );
};

// --- Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    chatContainer: {
        flex: 1,
        marginBottom: 8,
    },
    userMessage: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 8,
        marginVertical: 4,
        alignSelf: 'flex-end',
        maxWidth: '75%',
    },
    aiMessage: {
        backgroundColor: '#6a9abd',
        padding: 10,
        borderRadius: 8,
        marginVertical: 4,
        alignSelf: 'flex-start',
        maxWidth: '75%',
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginRight: 8,
    },
    suggestionList: {
        height: 40,
        marginBottom: 12,
        flexDirection: 'row',
        gap: 8,
    },
    suggestionChip: {
        backgroundColor: '#e0e0e0',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
    },
    suggestionText: {
        fontSize: 14,
        color: '#333',
    },
});

export default ChatScreen;
