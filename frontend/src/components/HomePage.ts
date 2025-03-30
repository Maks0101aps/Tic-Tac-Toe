import { getAuthState, login, register, logout, isTestAccount } from '../services/authService';
import { renderGamePage } from './GamePage';
import { renderAIGamePage } from './AIGamePage';
import { renderLoginForm, renderRegisterForm } from './AuthForms';
import { OFFLINE_MODE } from '../config';

// Render the home page
export const renderHomePage = (container: HTMLElement): void => {
  const { isAuthenticated, user } = getAuthState();
  
  if (isAuthenticated && user) {
    renderLoggedInHomePage(container, user.username);
  } else {
    renderLoggedOutHomePage(container);
  }
};

// Render home page for logged in users
const renderLoggedInHomePage = (container: HTMLElement, username: string): void => {
  const isTemporaryAccount = isTestAccount();
  const isOfflineMode = OFFLINE_MODE;

  container.innerHTML = `
    <div class="py-10">
      <div class="text-center mb-8">
        <h1>Welcome to Tic-Tac-Toe Online</h1>
        <p class="text-xl">Hello, ${username}!</p>
        ${isTemporaryAccount ? '<p class="mt-2 highlight p-2 inline-block">You are using a test account. Only AI games are available.</p>' : ''}
        ${isOfflineMode ? '<p class="mt-2 highlight p-2 inline-block bg-yellow-100">Offline Mode: Multiplayer games work across browser windows</p>' : ''}
      </div>
      
      <div class="card mx-auto max-w-2xl p-6">
        <div class="text-center mb-8">
          <h2 class="mb-2">Play a Game</h2>
          <p>Choose a game mode to start playing.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${!isTemporaryAccount ? `
          <div class="card p-6 text-center">
            <h3 class="font-title text-xl text-primary mb-3">Multiplayer Game</h3>
            <p class="mb-4">Play with friends online.</p>
            <div class="space-y-3">
              <button id="create-game-btn" class="btn btn-primary w-full mb-3">
                Create Game
              </button>
              <div class="flex flex-col items-center space-y-3">
                <div class="flex w-full">
                  <input type="text" id="game-code-input" placeholder="Enter game code" class="input flex-grow rounded-r-none" 
                    pattern="game-[0-9]{4}" title="Game code format: game-XXXX">
                  <button id="join-game-btn" class="btn btn-secondary rounded-l-none">
                    Join
                  </button>
                </div>
                ${isOfflineMode ? `
                <div class="text-xs pencil-text text-left mt-1">
                  In offline mode, create a game in one browser window and join it from another browser window.
                  <br>Game codes look like: <span class="font-mono">game-1234</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          ` : ''}
          
          <div class="${isTemporaryAccount ? 'mx-auto' : ''} card p-6 text-center">
            <h3 class="font-title text-xl text-secondary mb-3">Play against AI</h3>
            <p class="mb-4">Challenge our AI with different difficulty levels.</p>
            <div class="space-y-3">
              <div class="mb-4">
                <label class="block text-sm font-handwritten mb-1">Select Difficulty:</label>
                <select id="ai-difficulty" class="input">
                  <option value="easy">Easy</option>
                  <option value="medium" selected>Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <button id="play-ai-btn" class="btn btn-secondary w-full">
                Start AI Game
              </button>
            </div>
          </div>
        </div>
        
        <div class="mt-8 text-center">
          <button id="view-profile-btn" class="btn">
            View Profile
          </button>
          <button id="logout-btn" class="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>
      
      <div class="mt-8 text-center text-xs opacity-30 hover:opacity-90 transition-opacity easter-egg">
        <p>Made with ♥ by <a href="https://github.com/Maks0101aps" target="_blank" class="hover:underline">Maks0101aps</a></p>
      </div>
    </div>
  `;
  
  // Add event listeners
  const createGameBtn = document.getElementById('create-game-btn');
  const joinGameBtn = document.getElementById('join-game-btn');
  const gameCodeInput = document.getElementById('game-code-input') as HTMLInputElement;
  const playAiBtn = document.getElementById('play-ai-btn');
  const aiDifficultySelect = document.getElementById('ai-difficulty') as HTMLSelectElement;
  const logoutBtn = document.getElementById('logout-btn');
  const viewProfileBtn = document.getElementById('view-profile-btn');
  
  if (createGameBtn && !isTemporaryAccount) {
    createGameBtn.addEventListener('click', () => {
      renderGamePage(container, 'create');
    });
  }
  
  if (joinGameBtn && gameCodeInput && !isTemporaryAccount) {
    // Function to handle joining a game
    const handleJoinGame = () => {
      const gameCode = gameCodeInput.value.trim();
      if (gameCode) {
        // Basic validation for game code format
        if (/^game-\d{4}$/.test(gameCode)) {
          renderGamePage(container, 'join', gameCode);
        } else {
          alert('Please enter a valid game code in format: game-XXXX');
        }
      } else {
        alert('Please enter a game code');
      }
    };

    // Join button click
    joinGameBtn.addEventListener('click', handleJoinGame);
    
    // Enter key in input field
    gameCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleJoinGame();
      }
    });
  }
  
  if (playAiBtn && aiDifficultySelect) {
    playAiBtn.addEventListener('click', () => {
      const difficulty = aiDifficultySelect.value as 'easy' | 'medium' | 'hard';
      renderAIGamePage(container, difficulty);
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      renderHomePage(container);
    });
  }
  
  if (viewProfileBtn) {
    viewProfileBtn.addEventListener('click', () => {
      // Render profile page (to be implemented)
      alert('Profile page will be implemented soon!');
    });
  }
};

// Render home page for guests
const renderLoggedOutHomePage = (container: HTMLElement): void => {
  container.innerHTML = `
    <div class="py-10">
      <div class="text-center mb-12">
        <h1>Welcome to Tic-Tac-Toe Online</h1>
        <p class="text-xl">Sign in to play with friends!</p>
      </div>
      
      <div class="card mx-auto max-w-md p-6">
        <div class="flex justify-center space-x-4 mb-6">
          <button id="show-login-btn" class="btn btn-primary active-auth-tab">
            Login
          </button>
          <button id="show-register-btn" class="btn">
            Register
          </button>
        </div>
        
        <div id="auth-forms-container">
          <!-- Auth form will be rendered here -->
        </div>
        
        <div class="card mt-6 p-4 bg-white">
          <h3 class="font-title text-lg text-primary mb-2">Test Account Available</h3>
          <p class="text-sm mb-2">Use these credentials to test the application:</p>
          <div class="bg-white p-3 rounded border">
            <div><span class="font-bold">Email:</span> test@example.com</div>
            <div><span class="font-bold">Password:</span> password123</div>
          </div>
          <button id="use-test-account-btn" class="btn btn-primary mt-3 w-full">
            Use Test Account
          </button>
        </div>
      </div>
      
      <div class="mt-8 text-center text-xs opacity-30 hover:opacity-90 transition-opacity easter-egg">
        <p>Made with ♥ by <a href="https://github.com/Maks0101aps" target="_blank" class="hover:underline">Maks0101aps</a></p>
      </div>
    </div>
  `;
  
  // Get the forms container
  const formsContainer = document.getElementById('auth-forms-container');
  const showLoginBtn = document.getElementById('show-login-btn');
  const showRegisterBtn = document.getElementById('show-register-btn');
  const useTestAccountBtn = document.getElementById('use-test-account-btn');
  
  if (formsContainer && showLoginBtn && showRegisterBtn) {
    // Initial render of login form
    renderLoginForm(formsContainer, (email: string, password: string) => {
      login(email, password)
        .then(() => {
          renderHomePage(container);
        })
        .catch((error) => {
          alert(`Login failed: ${error.message}`);
        });
    });
    
    // Toggle between login and register forms
    showLoginBtn.addEventListener('click', () => {
      showLoginBtn.classList.add('btn-primary');
      showLoginBtn.classList.remove('btn');
      showRegisterBtn.classList.remove('btn-primary');
      showRegisterBtn.classList.add('btn');
      
      renderLoginForm(formsContainer, (email: string, password: string) => {
        login(email, password)
          .then(() => {
            renderHomePage(container);
          })
          .catch((error) => {
            alert(`Login failed: ${error.message}`);
          });
      });
    });
    
    showRegisterBtn.addEventListener('click', () => {
      showRegisterBtn.classList.add('btn-primary');
      showRegisterBtn.classList.remove('btn');
      showLoginBtn.classList.remove('btn-primary');
      showLoginBtn.classList.add('btn');
      
      renderRegisterForm(formsContainer, (username: string, email: string, password: string) => {
        register(username, email, password)
          .then(() => {
            renderHomePage(container);
          })
          .catch((error) => {
            alert(`Registration failed: ${error.message}`);
          });
      });
    });
  }
  
  // Add test account login button listener
  if (useTestAccountBtn) {
    useTestAccountBtn.addEventListener('click', () => {
      login('test@example.com', 'password123')
        .then(() => {
          renderHomePage(container);
        })
        .catch((error) => {
          alert(`Test account login failed: ${error.message}`);
        });
    });
  }
}; 