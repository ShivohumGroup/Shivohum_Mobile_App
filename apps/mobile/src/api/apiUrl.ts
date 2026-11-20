import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL_KEY = 'siteflow_api_base_url';
const DEFAULT_API_URL = 'http://localhost:3001/api/v1';

let cachedOverride: string | null | undefined;

function bakedUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  return (fromEnv || fromExtra || DEFAULT_API_URL).replace(/\/$/, '');
}

export async function hydrateApiBaseUrl(): Promise<string> {
  try {
    cachedOverride = await SecureStore.getItemAsync(API_URL_KEY);
  } catch {
    cachedOverride = null;
  }
  return getApiBaseUrl();
}

export function getApiBaseUrl(): string {
  if (cachedOverride) return cachedOverride.replace(/\/$/, '');
  return bakedUrl();
}

export async function setApiBaseUrlOverride(url: string): Promise<string> {
  const cleaned = url.trim().replace(/\/$/, '');
  await SecureStore.setItemAsync(API_URL_KEY, cleaned);
  cachedOverride = cleaned;
  return cleaned;
}

export async function clearApiBaseUrlOverride(): Promise<string> {
  await SecureStore.deleteItemAsync(API_URL_KEY);
  cachedOverride = null;
  return bakedUrl();
}
