import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    console.log('Web platformunda Push Token alınmaz.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Bildirim izni yok!');
      return;
    }

    try {
      // 🔥 Native Firebase Token Alıyoruz
      const tokenData = await Notifications.getDevicePushTokenAsync();
      token = tokenData.data;
      console.log('🔥 FIREBASE TOKEN:', token);
    } catch (e) {
      console.log('Token hatası:', e);
    }
  } else {
    console.log('Fiziksel cihaz gerekli - Emülatörde Device Token alınamayabilir');
  }

  return token;
}