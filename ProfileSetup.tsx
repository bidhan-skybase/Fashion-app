import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import {supabase} from './utils/supabase';
import {GoogleGenAI} from "@google/genai";
import {useNavigation} from "@react-navigation/native";
import Home from "./Home";


interface ProfileData {
    fullName: string;
    gender: 'male' | 'female' | '';
    skinTone: string;
    topSize: string;
    bottomSize: string;
    bio: string;
    profile_completed: boolean;
    style:string
}

interface User {
    id: string;
    email: string;
}

const ProfileScreen: React.FC = () => {
        const navigation = useNavigation();
        const [user, setUser] = useState<User | null>(null);
        const [loading, setLoading] = useState(false);
        const [profile, setProfile] = useState<ProfileData>({
            fullName: '',
            gender: '',
            skinTone: '',
            topSize: '',
            bottomSize: '',
            bio: '',
            profile_completed: false,
            style: '',
        });

        // Skin tone options
        const skinToneOptions = [
            'Fair',
            'Light',
            'Medium',
            'Olive',
            'Tan',
            'Dark',
            'Deep',
        ];

        // Skin tone options
        const styleOptions = [
            "Minimal",
            "Casual",
            "Vintage"
        ];

        // Size options based on gender
        const getSizeOptions = (gender: string) => {
            if (gender === 'male') {
                return ['L', 'XL', 'XXL'];
            } else if (gender === 'female') {
                return ['S', 'M'];
            }
            return [];
        };

        // Get current user
        useEffect(() => {
            const getCurrentUser = async () => {
                const {data: {session}} = await supabase.auth.getSession();
                if (session?.user) {
                    setUser({id: session.user.id, email: session.user.email || ''});
                    loadProfile(session.user.id);
                }
            };
            getCurrentUser();
        }, []);

        // Load existing profile
        const loadProfile = async (userId: string) => {
            try {
                const {data, error} = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    // console.error('Error loading profile:', error);
                    return;
                }

                if (data) {
                    setProfile({
                        fullName: data.full_name || '',
                        gender: data.gender || '',
                        skinTone: data.skin_tone || '',
                        topSize: data.top_size || '',
                        bottomSize: data.bottom_size || '',
                        bio: data.bio || '',
                        profile_completed: true,
                        style:data.style || '',
                    });
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        };

        // Save profile to database
        const saveProfile = async () => {
            if (!user) {
                Alert.alert('Error', 'User not found');
                return;
            }

            if (!profile.fullName || !profile.gender || !profile.skinTone) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            setLoading(true);
            try {
                const {error} = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        full_name: profile.fullName,
                        gender: profile.gender,
                        skin_tone: profile.skinTone,
                        top_size: profile.topSize,
                        bottom_size: profile.bottomSize,
                        bio: profile.bio,
                        profile_completed: profile.profile_completed,
                        updated_at: new Date().toISOString(),
                        style:profile.style

                    });

                if (error) {
                    throw error;
                }

                Alert.alert('Success', 'Profile saved successfully!');
                await generateRecommendation();
            } catch (error: any) {
                console.error('Error saving profile:', error);
                Alert.alert('Error', error.message || 'Failed to save profile');
            } finally {
                setLoading(false);
            }
        };

        // Generate AI recommendation
        const generateRecommendation = async () => {
            if (!user) return;

            const recommendationText = `
You are a fashion stylist AI assistant.

The user profile is:
- Gender: ${profile.gender}
- Skin Tone: ${profile.skinTone}
- Top Size: ${profile.topSize}
- Bottom Size: ${profile.bottomSize}
- Style: ${profile.style}
${profile.bio ? `- Bio: ${profile.bio}` : ''}

Suggest 1–2 outfit styles ideal for this profile. Recommend:
1. Outfit ideas (top, bottom, layer, shoes)
2. Ideal color palette based on skin tone
3. Fit advice for body proportions

Keep it short, friendly, and practical for everyday or travel.
`;

            try {
                const ai = new GoogleGenAI({
                    apiKey: "AIzaSyAPioEgdNBjVVS8br54PaGW4k1qLPmBtUk"
                });


                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: recommendationText,
                });
                const recommendation = response.text;



                // Save recommendation to database
                const {error} = await supabase
                    .from('recommendations')
                    .insert({
                        user_id: user.id,
                        recommendation_text: recommendation,
                    });

                if (error) {
                    console.error('Error saving recommendation:', error);
                    // Don't block navigation if recommendation save fails
                }

                // Navigate to Home after everything is complete
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });

            } catch (error) {
                console.error('Error generating recommendation:', error);
                // Still navigate to Home even if recommendation fails
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        };
// Sign out function
        const handleSignOut = async () => {
            await supabase.auth.signOut();
            navigation.navigate("Auth")
        };

// Reset sizes when gender changes
        const handleGenderChange = (gender: 'male' | 'female') => {
            setProfile(prev => ({
                ...prev,
                gender,
                topSize: '',
                bottomSize: '',
            }));
        };

        return (
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Profile Setup</Text>
                    <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            value={profile.fullName}
                            onChangeText={(text) => setProfile(prev => ({...prev, fullName: text}))}
                        />
                    </View>

                    {/* Gender Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender *</Text>
                        <View style={styles.radioGroup}>
                            <TouchableOpacity
                                style={[
                                    styles.radioButton,
                                    profile.gender === 'male' && styles.radioButtonSelected
                                ]}
                                onPress={() => handleGenderChange('male')}
                            >
                                <Text style={[
                                    styles.radioText,
                                    profile.gender === 'male' && styles.radioTextSelected
                                ]}>
                                    Male
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.radioButton,
                                    profile.gender === 'female' && styles.radioButtonSelected
                                ]}
                                onPress={() => handleGenderChange('female')}
                            >
                                <Text style={[
                                    styles.radioText,
                                    profile.gender === 'female' && styles.radioTextSelected
                                ]}>
                                    Female
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Skin Tone Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Skin Tone *</Text>
                        <View style={styles.optionsGrid}>
                            {skinToneOptions.map((tone) => (
                                <TouchableOpacity
                                    key={tone}
                                    style={[
                                        styles.optionButton,
                                        profile.skinTone === tone && styles.optionButtonSelected
                                    ]}
                                    onPress={() => setProfile(prev => ({...prev, skinTone: tone}))}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        profile.skinTone === tone && styles.optionTextSelected
                                    ]}>
                                        {tone}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/*Style selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Style </Text>
                        <View style={styles.optionsGrid}>
                            {styleOptions.map((style) => (
                                <TouchableOpacity
                                    key={style}
                                    style={[
                                        styles.optionButton,
                                        profile.style === style && styles.optionButtonSelected
                                    ]}
                                    onPress={() => setProfile(prev => ({...prev, style: style}))}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        profile.style === style && styles.optionTextSelected
                                    ]}>
                                        {style}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>


                    {/* Size Selection - Only show if gender is selected */}
                    {profile.gender && (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Top Size</Text>
                                <View style={styles.sizeGroup}>
                                    {getSizeOptions(profile.gender).map((size) => (
                                        <TouchableOpacity
                                            key={`top-${size}`}
                                            style={[
                                                styles.sizeButton,
                                                profile.topSize === size && styles.sizeButtonSelected
                                            ]}
                                            onPress={() => setProfile(prev => ({...prev, topSize: size}))}
                                        >
                                            <Text style={[
                                                styles.sizeText,
                                                profile.topSize === size && styles.sizeTextSelected
                                            ]}>
                                                {size}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Bottom Size</Text>
                                <View style={styles.sizeGroup}>
                                    {getSizeOptions(profile.gender).map((size) => (
                                        <TouchableOpacity
                                            key={`bottom-${size}`}
                                            style={[
                                                styles.sizeButton,
                                                profile.bottomSize === size && styles.sizeButtonSelected
                                            ]}
                                            onPress={() => setProfile(prev => ({...prev, bottomSize: size}))}
                                        >
                                            <Text style={[
                                                styles.sizeText,
                                                profile.bottomSize === size && styles.sizeTextSelected
                                            ]}>
                                                {size}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}

                    {/* Bio */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio (Optional)</Text>
                        <Text style={styles.sublabel}>Tell us about your work habits, age, lifestyle, etc.</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="e.g., I'm a 25-year-old office worker who prefers comfortable, professional clothing..."
                            value={profile.bio}
                            onChangeText={(text) => setProfile(prev => ({...prev, bio: text}))}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={saveProfile}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff"/>
                        ) : (
                            <Text style={styles.saveButtonText}>Save Profile & Get Recommendations</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }
;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    signOutButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#ff4444',
        borderRadius: 5,
    },
    signOutText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    sublabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 15,
    },
    radioButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    radioButtonSelected: {
        borderColor: '#007bff',
        backgroundColor: '#007bff',
    },
    radioText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    radioTextSelected: {
        color: '#fff',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    optionButtonSelected: {
        borderColor: '#007bff',
        backgroundColor: '#007bff',
    },
    optionText: {
        fontSize: 14,
        color: '#333',
    },
    optionTextSelected: {
        color: '#fff',
    },
    sizeGroup: {
        flexDirection: 'row',
        gap: 10,
    },
    sizeButton: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        minWidth: 60,
        alignItems: 'center',
    },
    sizeButtonSelected: {
        borderColor: '#007bff',
        backgroundColor: '#007bff',
    },
    sizeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    sizeTextSelected: {
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#28a745',
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;
