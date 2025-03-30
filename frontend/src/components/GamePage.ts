import { getAuthState, isTestAccount } from '../services/authService';
import { createGame, joinGame, makeMove, leaveGame, onGameUpdate, onGameOver, Game, GameStatus, PlayerMark, GameMode } from '../services/gameService';
import { renderHomePage } from './HomePage';
import { renderGameBoard } from './GameBoard';
import { renderChat } from './Chat';
import { OFFLINE_MODE } from '../config';
import { showToast } from '../utils/toast';

// Render game page
export const renderGamePage = (container: HTMLElement, mode: 'create' | 'join', gameId?: string): void => {
  const { user } = getAuthState();
  
  if (!user) {
    // User not logged in, redirect to home
    renderHomePage(container);
    return;
  }
  
  // Check if user is using a test account (only allowed to play with AI)
  if (isTestAccount()) {
    container.innerHTML = `
      <div class="py-10 text-center">
        <div class="card p-6 mx-auto max-w-lg">
          <h2 class="text-xl text-error mb-4">Restricted Access</h2>
          <p class="mb-4 font-handwritten">Test accounts can only play against AI.</p>
          <button id="back-home-btn" class="btn btn-primary">Back to Home</button>
        </div>
      </div>
    `;
    
    const backButton = document.getElementById('back-home-btn');
    if (backButton) {
      backButton.addEventListener('click', () => {
        renderHomePage(container);
      });
    }
    
    return;
  }
  
  // Initial game page UI with loading state
  container.innerHTML = `
    <div class="py-6">
      <div class="flex items-center mb-8">
        <button id="back-button" class="btn flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Back to Home
        </button>
      </div>
      
      <div id="game-container" class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
          <h1>Tic-Tac-Toe Game</h1>
          <div id="game-status" class="text-lg">
            <div class="flex justify-center items-center">
              <svg class="animate-spin h-5 w-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="pencil-text">${mode === 'create' ? 'Creating game...' : 'Joining game...'}</span>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div id="game-board-container" class="lg:col-span-2">
            <!-- Game board will be rendered here -->
            <div class="card text-center">
              <div class="animate-pulse">
                <div class="h-64 bg-gray-200 rounded-md"></div>
              </div>
            </div>
          </div>
          
          <div id="game-info-container" class="lg:col-span-1">
            <!-- Game info and chat will be rendered here -->
            <div class="card">
              <div class="animate-pulse space-y-4">
                <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                <div class="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add back button event listener
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      if (gameId) {
        leaveGame(gameId);
      }
      renderHomePage(container);
    });
  }
  
  // Get containers for game board and info
  const gameBoardContainer = document.getElementById('game-board-container');
  const gameInfoContainer = document.getElementById('game-info-container');
  const gameStatusElement = document.getElementById('game-status');
  
  if (!gameBoardContainer || !gameInfoContainer || !gameStatusElement) {
    console.error('Game page containers not found!');
    return;
  }
  
  // Keep track of the current game state
  let currentGame: Game | null = null;
  
  // Set up game update callback
  onGameUpdate((game: Game) => {
    currentGame = game;
    updateGameUI(container, game, gameStatusElement, gameBoardContainer, gameInfoContainer);
  });
  
  // Set up game over callback
  onGameOver((winner: PlayerMark | 'DRAW') => {
    if (gameStatusElement && currentGame) {
      let messageHtml = '';
      
      if (winner === 'DRAW') {
        messageHtml = `<div class="text-yellow-600 font-bold">Game ended in a draw!</div>`;
      } else {
        const { user } = getAuthState();
        const winnerUsername = winner === PlayerMark.X ? currentGame.players.X?.username : currentGame.players.O?.username;
        const isCurrentUserWinner = (winner === PlayerMark.X && currentGame.players.X?.id === user?.id) || 
                                   (winner === PlayerMark.O && currentGame.players.O?.id === user?.id);
        
        if (isCurrentUserWinner) {
          messageHtml = `<div class="text-green-600 font-bold">You won the game!</div>`;
        } else {
          messageHtml = `<div class="text-red-600 font-bold">${winnerUsername} won the game!</div>`;
        }
      }
      
      gameStatusElement.innerHTML = messageHtml;
    }
  });
  
  // Create or join the game
  if (mode === 'create') {
    createGame(user.username, (response) => {
      if (response.success && response.game) {
        currentGame = response.game;
        gameId = response.game.id;
        updateGameUI(container, response.game, gameStatusElement, gameBoardContainer, gameInfoContainer);
        showToast(`Game created! Code: ${response.game.id}`, 'success');
      } else {
        gameStatusElement.innerHTML = `<div class="text-red-600">Error creating game: ${response.error || 'Unknown error'}</div>`;
        showToast(`Error creating game: ${response.error || 'Unknown error'}`, 'error');
      }
    });
  } else if (mode === 'join' && gameId) {
    joinGame(gameId, user.username, (response) => {
      if (response.success && response.game) {
        currentGame = response.game;
        updateGameUI(container, response.game, gameStatusElement, gameBoardContainer, gameInfoContainer);
        showToast(`Joined game successfully!`, 'success');
      } else {
        gameStatusElement.innerHTML = `<div class="text-red-600">Error joining game: ${response.error || 'Game not found'}</div>`;
        showToast(`Error joining game: ${response.error || 'Game not found'}`, 'error');
      }
    });
  }
};

// Helper function to update game UI
const updateGameUI = (
  container: HTMLElement,
  game: Game,
  gameStatusElement: HTMLElement,
  gameBoardContainer: HTMLElement,
  gameInfoContainer: HTMLElement
): void => {
  const { user } = getAuthState();
  
  // For offline mode, always allow interaction regardless of whose turn it is
  const isOfflineMode = OFFLINE_MODE;
  
  // Update game status
  let statusMessage = '';
  let statusClass = '';
  
  if (game.status === GameStatus.WAITING) {
    // Show game code for sharing
    statusClass = 'text-secondary';
    statusMessage = `
      <div>Waiting for another player to join...</div>
      <div class="mt-2 flex items-center justify-center">
        <span class="font-medium mr-2">Game Code:</span> 
        <span class="font-mono highlight px-3 py-1 rounded-lg">${game.id}</span>
        <button id="copy-code-btn" class="btn btn-primary ml-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </button>
      </div>
      ${isOfflineMode ? `
      <div class="mt-3 text-sm font-handwritten highlight py-2 px-3 rounded-lg">
        <p>In offline mode, copy this code and use it to join from another browser window.</p>
        <p class="mt-1">Joining URL: <strong>${window.location.origin}?join=${game.id}</strong></p>
      </div>
      ` : ''}
    `;
  } else if (game.status === GameStatus.IN_PROGRESS) {
    // For offline mode multiplayer, always allow playing
    if (isOfflineMode && game.mode === GameMode.MULTIPLAYER) {
      statusClass = 'text-primary';
      statusMessage = `
        <div>Game in progress</div>
        <div class="mt-1">Current turn: ${game.currentTurn === PlayerMark.X ? 'Player X' : 'Player O'}</div>
      `;
    } else {
      const isPlayerTurn = 
        (game.currentTurn === PlayerMark.X && game.players.X?.id === user?.id) ||
        (game.currentTurn === PlayerMark.O && game.players.O?.id === user?.id);
      
      if (isPlayerTurn) {
        statusClass = 'text-primary';
        statusMessage = `
          <div>Your turn to move!</div>
        `;
      } else {
        statusClass = 'text-secondary';
        statusMessage = `
          <div>Waiting for opponent's move...</div>
        `;
      }
    }
  } else if (game.status === GameStatus.FINISHED) {
    if (game.winner === 'DRAW') {
      statusClass = 'text-yellow-600';
      statusMessage = `
        <div>Game ended in a draw!</div>
      `;
    } else {
      // For offline mode, show winner message regardless of player role
      if (isOfflineMode && game.mode === GameMode.MULTIPLAYER) {
        statusClass = game.winner === PlayerMark.X ? 'text-primary' : 'text-secondary';
        statusMessage = `
          <div>${game.winner === PlayerMark.X ? 'Player X' : 'Player O'} has won the game!</div>
        `;
      } else {
        const isCurrentUserWinner = 
          (game.winner === PlayerMark.X && game.players.X?.id === user?.id) || 
          (game.winner === PlayerMark.O && game.players.O?.id === user?.id);
        
        if (isCurrentUserWinner) {
          statusClass = 'text-success';
          statusMessage = `
            <div>You won the game!</div>
          `;
        } else {
          statusClass = 'text-error';
          const winnerUsername = game.winner === PlayerMark.X ? game.players.X?.username : game.players.O?.username;
          statusMessage = `
            <div>${winnerUsername} won the game!</div>
          `;
        }
      }
    }
  }
  
  // Update status element
  gameStatusElement.innerHTML = `
    <div class="${statusClass}">
      ${statusMessage}
    </div>
  `;
  
  // Add copy code button functionality after updating the DOM
  if (game.status === GameStatus.WAITING) {
    const copyCodeBtn = document.getElementById('copy-code-btn');
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(game.id)
          .then(() => {
            copyCodeBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyCodeBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              `;
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy game code:', err);
          });
      });
    }
  }
  
  // Render the game board
  renderGameBoard(gameBoardContainer, game, (position: number) => {
    // For offline mode, always allow moves regardless of whose turn it is
    if (isOfflineMode && game.mode === GameMode.MULTIPLAYER) {
      makeMove(game.id, position, (response) => {
        if (!response.success) {
          showToast(`Error making move: ${response.error}`, 'error');
        }
      });
      return;
    }
    
    // For online mode, check if it's the player's turn
    const isPlayerTurn = 
      (game.currentTurn === PlayerMark.X && game.players.X?.id === user?.id) ||
      (game.currentTurn === PlayerMark.O && game.players.O?.id === user?.id);
    
    if (isPlayerTurn) {
      makeMove(game.id, position, (response) => {
        if (!response.success) {
          showToast(`Error making move: ${response.error}`, 'error');
        }
      });
    } else {
      showToast("It's not your turn!", 'warning');
    }
  });
  
  // Render the game info (chat & player list)
  gameInfoContainer.innerHTML = `
    <div class="card p-4 mb-4">
      <h3 class="font-title text-lg mb-4">Game Info</h3>
      <div class="space-y-2 font-handwritten">
        <div class="flex justify-between py-1 border-b">
          <span>Player X:</span>
          <span class="font-title text-primary">${game.players.X?.username || 'Waiting...'}</span>
        </div>
        <div class="flex justify-between py-1 border-b">
          <span>Player O:</span>
          <span class="font-title text-secondary">${game.players.O?.username || 'Waiting...'}</span>
        </div>
        <div class="flex justify-between py-1">
          <span>Status:</span>
          <span class="${
            game.status === GameStatus.WAITING ? 'text-yellow-600' :
            game.status === GameStatus.IN_PROGRESS ? 'text-primary' :
            'text-secondary'
          }">${
            game.status === GameStatus.WAITING ? 'Waiting for players' :
            game.status === GameStatus.IN_PROGRESS ? 'In progress' :
            'Finished'
          }</span>
        </div>
      </div>
    </div>
    
    <div id="chat-container">
      <!-- Chat will be rendered here -->
    </div>
  `;
  
  // Render the chat
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    renderChat(chatContainer, game.id);
  }
}; 