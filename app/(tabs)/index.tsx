import { useEffect, useState } from 'react';
import { Image, StyleSheet, Platform, Button, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthSessionResult } from 'expo-auth-session';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Define interface for user information
interface UserInfo {
  name: string;
  email: string;
  picture?: string;
  verified_email?: boolean;
}

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '281489889848-6ah76l90bmbol3qacfkr6n6fkec0a2fe.apps.googleusercontent.com',
    iosClientId: '281489889848-1hbjqkm611hc8j73uoe6hqn5qta2jcf4.apps.googleusercontent.com',
    webClientId: '281489889848-ad671csoe98vbjsmf45eiflum573t5fa.apps.googleusercontent.com',
    // Configure platform specific options
    ...(Platform.OS === 'web' ? {
      redirectUri: 'http://localhost:8081/@mramkishore/google-signin-app'
    } : Platform.OS === 'android' ? {
      redirectUri: `com.mramkishore.googlesigninapp:/oauth2redirect`
    } : {})
  });

  useEffect(() => {
    handleEffect();
  }, [response]);

  async function handleEffect(): Promise<void> {
    const user = await getLocalUser();
    if (!user) {
      if (response?.type === 'success') {
        let token;
        if (Platform.OS === 'android') {
          // For Android, we use the id_token
          token = response.params.id_token;
        } else {
          // For web and iOS, we use the access_token
          token = response.authentication?.accessToken;
        }
        
        if (token) {
          await getUserInfo(token);
        }
      }
    } else {
      setUserInfo(user);
    }
  }

  const getLocalUser = async (): Promise<UserInfo | null> => {
    try {
      const data = await AsyncStorage.getItem('@user');
      if (!data) return null;
      return JSON.parse(data) as UserInfo;
    } catch (error) {
      console.error('Error getting local user:', error);
      return null;
    }
  };

  const getUserInfo = async (token: string): Promise<void> => {
    if (!token) return;
    try {
      const response = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
      
      const user = await response.json() as UserInfo;
      await AsyncStorage.setItem('@user', JSON.stringify(user));
      setUserInfo(user);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('@user');
      setUserInfo(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          {userInfo ? `Welcome, ${userInfo.name}!` : 'Welcome!'}
        </ThemedText>
        <HelloWave />
      </ThemedView>

      {!userInfo ? (
        <ThemedView style={styles.authContainer}>
          <ThemedText>Sign in to get started</ThemedText>
          <Button
            title="Sign in with Google"
            disabled={!request}
            onPress={() => promptAsync()}
          />
        </ThemedView>
      ) : (
        <>
          <ThemedView style={styles.userInfoContainer}>
            {userInfo?.picture && (
              <Image
                source={{ uri: userInfo.picture }}
                style={styles.profileImage}
              />
            )}
            <ThemedText>{userInfo.email}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.stepContainer}>
            <ThemedText type="subtitle">Step 1: Try it</ThemedText>
            <ThemedText>
              Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
              Press{' '}
              <ThemedText type="defaultSemiBold">
                {Platform.select({
                  ios: 'cmd + d',
                  android: 'cmd + m',
                  web: 'F12'
                })}
              </ThemedText>{' '}
              to open developer tools.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.stepContainer}>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
            <ThemedText>
              Tap the Explore tab to learn more about what's included in this starter app.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.stepContainer}>
            <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
            <ThemedText>
              When you're ready, run{' '}
              <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
              <ThemedText type="defaultSemiBold">app</ThemedText> directory.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.signOutContainer}>
            <Button
              title="Sign Out"
              onPress={handleSignOut}
            />
          </ThemedView>
        </>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  authContainer: {
    alignItems: 'center',
    gap: 16,
    marginVertical: 20,
  },
  userInfoContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  signOutContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
});