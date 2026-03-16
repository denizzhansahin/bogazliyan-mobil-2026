import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';

const analytics = getAnalytics(getApp());

export const trackEvent = async (
  eventName: string,
  params?: Record<string, any>
) => {
  await logEvent(analytics, eventName, params);
};



export const trackScreen = async (
  screenName: string,
  params?: Record<string, any>
) => {
  await logEvent(analytics, 'screen_view', {
    screen_name: screenName,
    ...params,
  });
};


export const trackButton = async (
  buttonName: string,
  screen: string,
  extra?: Record<string, any>
) => {
  await logEvent(analytics, 'button_click', {
    button_name: buttonName,
    screen,
    ...extra,
  });
};
