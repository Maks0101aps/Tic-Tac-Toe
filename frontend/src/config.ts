// API URLs and Offline Mode Configuration

// Check localStorage for offline mode preference (defaults to true if not set)
const offlineModeSetting = localStorage.getItem('offline_mode');
export const OFFLINE_MODE = offlineModeSetting === null ? true : offlineModeSetting === 'true';

// Function to toggle offline mode
export const toggleOfflineMode = (enabled: boolean): void => {
  localStorage.setItem('offline_mode', enabled.toString());
  // Reload the page to apply changes
  window.location.reload();
};

// Function to show offline mode status in UI
export const getOfflineModeStatus = (): string => {
  return OFFLINE_MODE ? 
    'Offline Mode: Games work across browser windows' : 
    'Online Mode: Connected to server';
};

// API endpoints - use empty string for offline mode
export const API_URL = OFFLINE_MODE ? '' : 'http://localhost:3000/api'; 
export const SOCKET_URL = OFFLINE_MODE ? '' : 'http://localhost:3000';

// Local storage keys
export const TOKEN_KEY = 'tictactoe_token';
export const USER_KEY = 'tictactoe_user';
export const GAME_STORAGE_KEY = 'tictactoe_games'; 