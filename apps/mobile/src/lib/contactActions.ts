import * as Clipboard from 'expo-clipboard';
import { Alert, Linking } from 'react-native';

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export async function dialPhone(phone: string) {
  const url = `tel:${digitsOnly(phone)}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    Alert.alert('Unable to dial', 'Calling is not available on this device.');
    return;
  }
  await Linking.openURL(url);
}

export async function openWhatsApp(phone: string, message?: string) {
  const cleaned = digitsOnly(phone).replace(/^\+/, '');
  const text = encodeURIComponent(message || 'Hello from SiteFlow');
  const appUrl = `whatsapp://send?phone=${cleaned}&text=${text}`;
  const webUrl = `https://wa.me/${cleaned}?text=${text}`;
  try {
    const can = await Linking.canOpenURL(appUrl);
    await Linking.openURL(can ? appUrl : webUrl);
  } catch {
    Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp.');
  }
}

export async function copyPhone(phone: string) {
  await Clipboard.setStringAsync(phone);
  Alert.alert('Copied', 'Phone number copied to clipboard.');
}
