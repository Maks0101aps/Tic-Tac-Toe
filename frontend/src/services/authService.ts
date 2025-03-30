import { API_URL, TOKEN_KEY, USER_KEY, OFFLINE_MODE } from '../config';

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
}

// Authentication state
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

// Test account credentials
const TEST_ACCOUNT = {
  email: 'test@example.com',
  password: 'password123',
  username: 'TestUser',
  id: 1,
  wins: 5,
  losses: 3,
  draws: 2,
  createdAt: new Date().toISOString()
};

// Test account token
const TEST_TOKEN = 'test-jwt-token-placeholder';

// Singleton for auth state
const authState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

// Initialize auth state from local storage
export const initAuth = async (): Promise<void> => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  
  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      authState.token = token;
      authState.user = user;
      authState.isAuthenticated = true;
      
      // Validate token by fetching current user
      await getCurrentUser();
    } catch (error) {
      console.error('Error initializing auth:', error);
      logout();
    }
  }
};

// Login user
export const login = async (email: string, password: string): Promise<User> => {
  // For test account, bypass API call
  if (email === TEST_ACCOUNT.email && password === TEST_ACCOUNT.password) {
    const testUser: User = {
      id: TEST_ACCOUNT.id,
      username: TEST_ACCOUNT.username,
      email: TEST_ACCOUNT.email,
      wins: TEST_ACCOUNT.wins,
      losses: TEST_ACCOUNT.losses,
      draws: TEST_ACCOUNT.draws,
      createdAt: TEST_ACCOUNT.createdAt
    };
    
    // Save token and user to local storage
    localStorage.setItem(TOKEN_KEY, TEST_TOKEN);
    localStorage.setItem(USER_KEY, JSON.stringify(testUser));
    
    // Update auth state
    authState.token = TEST_TOKEN;
    authState.user = testUser;
    authState.isAuthenticated = true;
    
    return testUser;
  }
  
  // Check if we're in offline mode
  if (OFFLINE_MODE) {
    // Try to find a user with matching email in localStorage
    const storedUserJson = localStorage.getItem(USER_KEY);
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson) as User;
        if (storedUser.email === email) {
          // In offline mode, we can't verify the password, so we'll just accept it
          console.log('Offline mode: found matching email, accepting login');
          
          // Generate a mock token
          const mockToken = `mock-token-${Date.now()}`;
          
          // Update localStorage and auth state
          localStorage.setItem(TOKEN_KEY, mockToken);
          
          // Update auth state
          authState.token = mockToken;
          authState.user = storedUser;
          authState.isAuthenticated = true;
          
          return storedUser;
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // If no matching user is found in offline mode
    throw new Error('No account found with this email in offline mode. Please register first or use the test account.');
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    // Check for content type to determine if we got JSON or HTML
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Received non-JSON response from server:', await response.text());
      throw new Error('Server returned an invalid response. Please try again or use the test account.');
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    
    // Save token and user to local storage
    localStorage.setItem(TOKEN_KEY, data.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
    
    // Update auth state
    authState.token = data.data.token;
    authState.user = data.data.user;
    authState.isAuthenticated = true;
    
    return data.data.user;
  } catch (error) {
    console.error('Login error:', error);
    // If email is the test account's email but password is wrong, show a specific error
    if (email === TEST_ACCOUNT.email) {
      throw new Error('Incorrect password for test account. Use "password123".');
    }
    // If server is not available, suggest using test account
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Server connection failed. Please try again later or use the test account.');
    }
    throw error;
  }
};

// Register user
export const register = async (username: string, email: string, password: string): Promise<User> => {
  // For test account, bypass API call
  if (email === TEST_ACCOUNT.email) {
    throw new Error('This email is already registered with a test account. Please use a different email.');
  }
  
  // Check if we're in offline mode
  if (OFFLINE_MODE) {
    console.log('Running in offline mode, creating mock user account');
    
    // Generate a mock user
    const mockUser: User = {
      id: Math.floor(Math.random() * 10000), // Random ID
      username: username,
      email: email,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: new Date().toISOString()
    };
    
    // Generate a mock token
    const mockToken = `mock-token-${Date.now()}`;
    
    // Save token and user to local storage
    localStorage.setItem(TOKEN_KEY, mockToken);
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
    
    // Update auth state
    authState.token = mockToken;
    authState.user = mockUser;
    authState.isAuthenticated = true;
    
    return mockUser;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });
    
    // Check for content type to determine if we got JSON or HTML
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Received non-JSON response from server:', await response.text());
      throw new Error('Server returned an invalid response. Please try again or use the test account.');
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    const data = await response.json();
    
    // Save token and user to local storage
    localStorage.setItem(TOKEN_KEY, data.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
    
    // Update auth state
    authState.token = data.data.token;
    authState.user = data.data.user;
    authState.isAuthenticated = true;
    
    return data.data.user;
  } catch (error) {
    console.error('Registration error:', error);
    // If server is not available, allow using test account instead
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.warn('Server connection failed, falling back to offline mode');
      // Simulate the registration by logging in with the test account
      return login(TEST_ACCOUNT.email, TEST_ACCOUNT.password);
    }
    throw error;
  }
};

// Logout user
export const logout = (): void => {
  // Clear local storage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  // Update auth state
  authState.token = null;
  authState.user = null;
  authState.isAuthenticated = false;
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  if (!authState.token) {
    return null;
  }
  
  // If using test token, return the test user
  if (authState.token === TEST_TOKEN) {
    return authState.user;
  }
  
  // In offline mode, just return the current user state
  if (OFFLINE_MODE) {
    return authState.user;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
      }
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Server returned non-JSON response:', contentType);
      if (OFFLINE_MODE) {
        // In offline mode, just return the current auth state
        return authState.user;
      }
      // If not in offline mode, handle as error
      logout();
      return null;
    }
    
    const data = await response.json();
    
    // Update local storage and auth state
    localStorage.setItem(USER_KEY, JSON.stringify(data.data));
    authState.user = data.data;
    
    return data.data;
  } catch (error) {
    console.error('Get current user error:', error);
    
    // In offline mode, don't disrupt the experience due to network errors
    if (OFFLINE_MODE && authState.user) {
      console.log('Continuing in offline mode with existing user data');
      return authState.user;
    }
    
    return null;
  }
};

// Get auth state
export const getAuthState = (): AuthState => {
  return { ...authState };
};

// Check if current user is a test account
export const isTestAccount = (): boolean => {
  if (!authState.isAuthenticated || !authState.user) {
    return false;
  }
  
  return (
    authState.token === TEST_TOKEN || 
    authState.user.email === TEST_ACCOUNT.email
  );
}; 