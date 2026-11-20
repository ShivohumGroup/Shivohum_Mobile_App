import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '@/api/client';

/**
 * Registers local notification handler. Push delivery still needs Expo project
 * credentials (EAS projectId + FCM/APNs). When a token is available, it can be
 * stored via POST /devices/push-token for later push enablement.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationInfrastructure(opts?: {
  registerWithApi?: boolean;
}): Promise<{
  permission: string;
  projectIdHint: string;
  tokenRegistered: boolean;
}> {
  if (!Device.isDevice) {
    return {
      permission: 'undetermined',
      projectIdHint: 'Push requires a physical device and Expo project credentials.',
      tokenRegistered: false,
    };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SiteFlow',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let tokenRegistered = false;
  const projectId =
    Constants.easConfig?.projectId ||
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

  if (opts?.registerWithApi && finalStatus === 'granted' && projectId) {
    try {
      const push = await Notifications.getExpoPushTokenAsync({ projectId });
      await api.post('/devices/push-token', {
        token: push.data,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      tokenRegistered = true;
    } catch {
      // Credentials may be missing — keep infrastructure-only behavior.
    }
  }

  return {
    permission: finalStatus,
    projectIdHint: projectId
      ? 'Expo projectId present. Configure FCM/APNs in EAS for delivery.'
      : 'Set extra.eas.projectId / EAS credentials before push delivery works.',
    tokenRegistered,
  };
}
