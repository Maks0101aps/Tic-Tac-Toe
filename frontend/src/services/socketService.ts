import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_URL, OFFLINE_MODE } from '../config';
import { getAuthState } from './authService';
import { setGameService } from './gameService';

// Socket instance that will be used across the application
let socket: Socket | null = null;

/**
 * Initialize the Socket.io connection
 */
export const initializeSocketConnection = (): void => {
  const { isAuthenticated, token } = getAuthState();
  
  // Close existing connection if any
  if (socket) {
    socket.disconnect();
  }
  
  // Skip socket connection in offline mode
  if (OFFLINE_MODE) {
    console.log('Running in offline mode, skipping socket connection');
    setGameService(null);
    return;
  }
  
  if (isAuthenticated && token) {
    try {
      // Connect to the WebSocket server with authentication
      socket = io(SOCKET_URL, {
        auth: {
          token
        }
      });
      
      // Setup event listeners
      setupSocketListeners();
      
      // Initialize game service with socket connection
      setGameService(socket);
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      setGameService(null);
    }
  }
};

/**
 * Setup socket event listeners
 */
const setupSocketListeners = (): void => {
  if (!socket) return;
  
  socket.on('connect', () => {
    console.log('Connected to socket server');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

/**
 * Get the socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Emit an event to the server
 */
export const emitEvent = (event: string, data: any): void => {
  if (OFFLINE_MODE) {
    console.log(`[Offline mode] Emitting event ${event} skipped.`, data);
    return;
  }
  
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.error('Socket not connected. Unable to emit event:', event);
  }
};

/**
 * Subscribe to an event
 */
export const onEvent = (event: string, callback: (data: any) => void): void => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Unsubscribe from an event
 */
export const offEvent = (event: string, callback?: (data: any) => void): void => {
  if (socket) {
    socket.off(event, callback);
  }
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 