/**
 * Telegram WebApp SDK Integration
 * Handles all interactions with the Telegram WebApp API
 */

import { TelegramWebApp, TelegramUser } from '@/types';

// Telegram WebApp SDK type declaration
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

/**
 * Get the Telegram WebApp instance
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

/**
 * Check if running inside Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  return getTelegramWebApp() !== null;
}

/**
 * Get Telegram user data
 */
export function getTelegramUser(): TelegramUser | null {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
}

/**
 * Get Telegram init data for authentication
 */
export function getTelegramInitData(): string | null {
  const webApp = getTelegramWebApp();
  return webApp?.initData || null;
}

/**
 * Get start parameter from Telegram
 */
export function getStartParam(): string | null {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.start_param || null;
}

/**
 * Get theme color scheme
 */
export function getThemeScheme(): 'light' | 'dark' {
  const webApp = getTelegramWebApp();
  if (webApp?.colorScheme) {
    return webApp.colorScheme;
  }
  // Fallback to system preference
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Get theme parameters
 */
export function getThemeParams(): TelegramWebApp['themeParams'] {
  const webApp = getTelegramWebApp();
  return webApp?.themeParams || {};
}

/**
 * Initialize Telegram WebApp
 */
export function initTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    // Signal that the WebApp is ready
    webApp.ready();
    
    // Expand to full height
    webApp.expand();
    
    // Set background color based on theme
    const bgColor = webApp.themeParams.bg_color || 
      (webApp.colorScheme === 'dark' ? '#1a1a1a' : '#ffffff');
    webApp.setBackgroundColor(bgColor);
  }
}

/**
 * Configure the main button
 */
export function configureMainButton(
  text: string,
  onClick: () => void,
  options?: {
    color?: string;
    textColor?: string;
    isActive?: boolean;
    isLoading?: boolean;
  }
): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  webApp.MainButton.setText(text);
  webApp.MainButton.show();
  
  if (options?.color) {
    webApp.MainButton.color = options.color;
  }
  if (options?.textColor) {
    webApp.MainButton.textColor = options.textColor;
  }
  if (options?.isActive !== undefined) {
    if (options.isActive) {
      webApp.MainButton.enable();
    } else {
      webApp.MainButton.disable();
    }
  }
  if (options?.isLoading !== undefined) {
    if (options.isLoading) {
      webApp.MainButton.showProgress();
    } else {
      webApp.MainButton.hideProgress();
    }
  }

  // Remove previous click handler and add new one
  webApp.MainButton.offClick(onClick);
  webApp.MainButton.onClick(onClick);
}

/**
 * Hide the main button
 */
export function hideMainButton(): void {
  const webApp = getTelegramWebApp();
  webApp?.MainButton.hide();
}

/**
 * Configure the back button
 */
export function configureBackButton(onClick: () => void, show: boolean = true): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  if (show) {
    webApp.BackButton.show();
    webApp.BackButton.onClick(onClick);
  } else {
    webApp.BackButton.hide();
    webApp.BackButton.offClick(onClick);
  }
}

/**
 * Hide the back button
 */
export function hideBackButton(): void {
  const webApp = getTelegramWebApp();
  webApp?.BackButton.hide();
}

/**
 * Show alert dialog
 */
export function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showAlert(message, resolve);
    } else {
      alert(message);
      resolve();
    }
  });
}

/**
 * Show confirmation dialog
 */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showConfirm(message, resolve);
    } else {
      resolve(window.confirm(message));
    }
  });
}

/**
 * Show popup with custom buttons
 */
export function showPopup(
  message: string,
  title?: string,
  buttons?: Array<{ id: string; text: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive' }>
): Promise<string> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showPopup(
        {
          title,
          message,
          buttons: buttons || [{ type: 'ok' }],
        },
        resolve
      );
    } else {
      alert(message);
      resolve('ok');
    }
  });
}

/**
 * Trigger haptic feedback
 */
export function hapticFeedback(
  type: 'impact' | 'notification' | 'selection',
  style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'success' | 'warning'
): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  switch (type) {
    case 'impact':
      webApp.HapticFeedback.impactOccurred(style as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
      break;
    case 'notification':
      webApp.HapticFeedback.notificationOccurred(style as 'error' | 'success' | 'warning');
      break;
    case 'selection':
      webApp.HapticFeedback.selectionChanged();
      break;
  }
}

/**
 * Close the WebApp
 */
export function closeWebApp(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.close();
  }
}

/**
 * Enable closing confirmation
 */
export function enableClosingConfirmation(): void {
  const webApp = getTelegramWebApp();
  webApp?.enableClosingConfirmation();
}

/**
 * Disable closing confirmation
 */
export function disableClosingConfirmation(): void {
  const webApp = getTelegramWebApp();
  webApp?.disableClosingConfirmation();
}

/**
 * Apply Telegram theme to CSS variables
 */
export function applyTelegramTheme(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  const root = document.documentElement;
  const themeParams = webApp.themeParams;

  // Map Telegram theme params to CSS variables
  if (themeParams.bg_color) {
    root.style.setProperty('--tg-bg-color', themeParams.bg_color);
    root.style.setProperty('--background', themeParams.bg_color);
  }
  if (themeParams.text_color) {
    root.style.setProperty('--tg-text-color', themeParams.text_color);
    root.style.setProperty('--foreground', themeParams.text_color);
  }
  if (themeParams.hint_color) {
    root.style.setProperty('--tg-hint-color', themeParams.hint_color);
    root.style.setProperty('--muted-foreground', themeParams.hint_color);
  }
  if (themeParams.link_color) {
    root.style.setProperty('--tg-link-color', themeParams.link_color);
  }
  if (themeParams.button_color) {
    root.style.setProperty('--tg-button-color', themeParams.button_color);
    root.style.setProperty('--primary', themeParams.button_color);
  }
  if (themeParams.button_text_color) {
    root.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
    root.style.setProperty('--primary-foreground', themeParams.button_text_color);
  }
  if (themeParams.secondary_bg_color) {
    root.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color);
    root.style.setProperty('--secondary', themeParams.secondary_bg_color);
    root.style.setProperty('--card', themeParams.secondary_bg_color);
  }

  // Apply dark/light class to root
  if (webApp.colorScheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

/**
 * Get platform information
 */
export function getPlatform(): string {
  const webApp = getTelegramWebApp();
  return webApp?.platform || 'unknown';
}

/**
 * Get WebApp version
 */
export function getWebAppVersion(): string {
  const webApp = getTelegramWebApp();
  return webApp?.version || '0.0';
}

/**
 * Check if specific version is supported
 */
export function isVersionSupported(version: string): boolean {
  const webAppVersion = getWebAppVersion();
  const parseVersion = (v: string) => v.split('.').map(Number);
  
  const current = parseVersion(webAppVersion);
  const required = parseVersion(version);
  
  for (let i = 0; i < Math.max(current.length, required.length); i++) {
    const currentPart = current[i] || 0;
    const requiredPart = required[i] || 0;
    if (currentPart > requiredPart) return true;
    if (currentPart < requiredPart) return false;
  }
  return true;
}
