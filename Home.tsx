import {Button, ScrollView, Text, View} from "react-native";
import {supabase} from "./utils/supabase";

const Home = () => {
    return (
        <ScrollView>
            <View>
                <Text> Home</Text>
                <Button title={"Sign out"} onPress={() => {
                    supabase.auth.signOut();
                }}>

                </Button>
            </View>
        </ScrollView>
    );
}
export default Home;
