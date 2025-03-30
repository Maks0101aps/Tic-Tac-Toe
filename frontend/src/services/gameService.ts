import { Socket } from 'socket.io-client';
import { User } from './authService';
import { OFFLINE_MODE, GAME_STORAGE_KEY } from '../config';

// Game types
export enum PlayerMark {
  X = 'X',
  O = 'O'
}

// Game status
export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished'
}

// Game mode
export enum GameMode {
  MULTIPLAYER = 'multiplayer',
  AI = 'ai'
}

// Game interface
export interface Game {
  id: string;
  board: string[];
  currentTurn: PlayerMark;
  players: {
    X?: { id: string; username: string };
    O?: { id: string; username: string };
  };
  status: GameStatus;
  winner?: PlayerMark | 'DRAW';
  mode?: GameMode;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}

// Callbacks
type GameCallback = (game: Game) => void;
type ErrorCallback = (error: string) => void;

// Game service singleton
let socket: Socket | null = null;
let currentGame: Game | null = null;
let gameUpdateCallback: GameCallback | null = null;
let gameOverCallback: ((winner: PlayerMark | 'DRAW') => void) | null = null;

// Constants for localStorage keys
const CURRENT_GAME_KEY = 'tictactoe_current_game';

// Set socket connection
export const setGameService = (socketConnection: Socket | null): void => {
  socket = socketConnection;
  
  if (!socket) {
    console.log('Running without socket connection');
    // Try to restore game from localStorage in offline mode
    restoreGameFromLocalStorage();
    return;
  }
  
  // Set up listeners
  socket.on('game_update', (game: Game) => {
    // Skip AI games updates from socket as they are handled locally
    if (!game.mode || game.mode !== GameMode.AI) {
      currentGame = game;
      if (gameUpdateCallback) {
        gameUpdateCallback(game);
      }
    }
  });
  
  socket.on('game_over', ({ winner, gameId }) => {
    // Skip AI games over events from socket as they are handled locally
    if (currentGame && (!currentGame.mode || currentGame.mode !== GameMode.AI)) {
      if (gameOverCallback) {
        gameOverCallback(winner);
      }
    }
  });
};

// Save current game to localStorage
const saveGameToLocalStorage = (): void => {
  if (currentGame && OFFLINE_MODE) {
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(currentGame));
    
    // Also save to the games collection for better multi-browser support
    const gamesJson = localStorage.getItem(GAME_STORAGE_KEY) || '{}';
    try {
      const games = JSON.parse(gamesJson);
      games[currentGame.id] = currentGame;
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(games));
    } catch (e) {
      console.error('Error saving to games collection:', e);
    }
    
    console.log('Game saved to localStorage', currentGame.id);
  }
};

// Restore game from localStorage
const restoreGameFromLocalStorage = (): void => {
  if (OFFLINE_MODE) {
    const savedGameJson = localStorage.getItem(CURRENT_GAME_KEY);
    if (savedGameJson) {
      try {
        const savedGame = JSON.parse(savedGameJson) as Game;
        console.log('Restored game from localStorage', savedGame.id);
        currentGame = savedGame;
        
        // Notify game update callback if registered
        if (gameUpdateCallback) {
          gameUpdateCallback(savedGame);
        }
      } catch (e) {
        console.error('Error parsing saved game:', e);
      }
    }
  }
};

// Get a game by ID from localStorage (for multi-browser support)
const getGameFromStorage = (gameId: string): Game | null => {
  if (!OFFLINE_MODE) return null;
  
  const gamesJson = localStorage.getItem(GAME_STORAGE_KEY) || '{}';
  try {
    const games = JSON.parse(gamesJson);
    return games[gameId] || null;
  } catch (e) {
    console.error('Error retrieving game from storage:', e);
    return null;
  }
};

// Create a new game
export const createGame = (username: string, callback: (response: { success: boolean; game?: Game; error?: string }) => void): void => {
  if (!socket) {
    // In offline mode, create a mock multiplayer game
    if (OFFLINE_MODE) {
      console.log('Creating mock multiplayer game in offline mode');
      
      // Generate a mock game ID - shorter and easier to remember
      const gameId = 'game-' + Math.floor(1000 + Math.random() * 9000); // 4-digit code
      
      // Create offline game that will wait for a player to join
      const mockGame: Game = {
        id: gameId,
        board: Array(9).fill(''),
        currentTurn: PlayerMark.X,
        players: {
          X: { id: 'creator', username: username } // Creator is always X
        },
        status: GameStatus.WAITING,
        mode: GameMode.MULTIPLAYER
      };
      
      currentGame = mockGame;
      
      // Save game to localStorage
      saveGameToLocalStorage();
      
      // Notify callback of success
      callback({ success: true, game: mockGame });
      
      // Also notify game update callback if registered
      if (gameUpdateCallback) {
        gameUpdateCallback(mockGame);
      }
      
      return;
    }
    
    // If not in offline mode, return socket error
    callback({ success: false, error: 'Socket not connected' });
    return;
  }
  
  socket.emit('create_game', { username }, callback);
};

// Join an existing game
export const joinGame = (gameId: string, username: string, callback: (response: { success: boolean; game?: Game; error?: string }) => void): void => {
  if (!socket) {
    // In offline mode, handle joining a mock game
    if (OFFLINE_MODE) {
      console.log('Joining mock multiplayer game in offline mode');
      
      // Try to fetch the game from storage first
      const storedGame = getGameFromStorage(gameId);
      
      // In offline mode, force the game to start immediately
      // This allows players in different browsers to play together
      let mockGame: Game;
      
      if (storedGame) {
        // Update existing game with joined player and status
        mockGame = { ...storedGame };
        mockGame.players.O = { id: 'player', username: username };
        mockGame.status = GameStatus.IN_PROGRESS;
      } else {
        // Create a new game if none exists
        mockGame = {
          id: gameId,
          board: Array(9).fill(''),
          currentTurn: PlayerMark.X,
          players: {
            X: { id: 'host', username: 'Player X' }, // First player is always X
            O: { id: 'player', username: username }  // Second player (joiner) is always O
          },
          status: GameStatus.IN_PROGRESS,  // Force game to start immediately
          mode: GameMode.MULTIPLAYER
        };
      }
      
      // Set the new mock game as current
      currentGame = mockGame;
      
      // Save game to localStorage
      saveGameToLocalStorage();
      
      // Notify callback of success
      callback({ success: true, game: currentGame });
      
      // Also notify game update callback if registered
      if (gameUpdateCallback) {
        gameUpdateCallback(currentGame);
      }
      
      return;
    }
    
    // If not in offline mode, return socket error
    callback({ success: false, error: 'Socket not connected' });
    return;
  }
  
  socket.emit('join_game', { gameId, username }, callback);
};

// Make a move
export const makeMove = (gameId: string, position: number, callback: (response: { success: boolean; game?: Game; error?: string }) => void): void => {
  if (!socket) {
    // In offline mode, handle moves in the mock multiplayer game
    if (OFFLINE_MODE) {
      console.log(`Making move at position ${position} in offline mode`);
      
      // If not using current game, try to get it from storage
      if (!currentGame || currentGame.id !== gameId) {
        const storedGame = getGameFromStorage(gameId);
        if (storedGame) {
          currentGame = storedGame;
        } else {
          callback({ success: false, error: 'Game not found' });
          return;
        }
      }
      
      // Check if the game is in progress
      if (currentGame.status !== GameStatus.IN_PROGRESS) {
        callback({ success: false, error: 'Game is not in progress' });
        return;
      }
      
      // Check if the position is valid
      if (position < 0 || position >= 9) {
        callback({ success: false, error: 'Invalid position' });
        return;
      }
      
      // Check if the cell is already occupied
      if (currentGame.board[position]) {
        callback({ success: false, error: 'Cell already occupied' });
        return;
      }
      
      // Update the board with the move
      const updatedBoard = [...currentGame.board];
      updatedBoard[position] = currentGame.currentTurn;
      currentGame.board = updatedBoard;
      
      // Check for a winner or draw
      const winner = checkWinner(updatedBoard);
      
      if (winner) {
        currentGame.status = GameStatus.FINISHED;
        currentGame.winner = winner;
        
        // Save game to localStorage
        saveGameToLocalStorage();
        
        // Notify callback of success
        callback({ success: true, game: currentGame });
        
        // Notify game update callback
        if (gameUpdateCallback) {
          gameUpdateCallback(currentGame);
        }
        
        // Notify game over callback
        if (gameOverCallback) {
          gameOverCallback(winner);
        }
        
        return;
      }
      
      // Switch turns
      currentGame.currentTurn = currentGame.currentTurn === PlayerMark.X ? PlayerMark.O : PlayerMark.X;
      
      // Save game to localStorage
      saveGameToLocalStorage();
      
      // Notify callback of success
      callback({ success: true, game: currentGame });
      
      // Notify game update callback
      if (gameUpdateCallback) {
        gameUpdateCallback(currentGame);
      }
      
      return;
    }
    
    // If not in offline mode or no current game, return socket error
    callback({ success: false, error: 'Socket not connected' });
    return;
  }
  
  socket.emit('make_move', { gameId, position }, callback);
};

// Leave the game
export const leaveGame = (gameId: string): void => {
  // If it's an AI game, just clear the current game state
  if (currentGame && currentGame.mode === GameMode.AI && currentGame.id === gameId) {
    currentGame = null;
    return;
  }
  
  // Clear from localStorage if in offline mode
  if (OFFLINE_MODE) {
    localStorage.removeItem(CURRENT_GAME_KEY);
  }
  
  // Otherwise, notify the server
  if (!socket) {
    currentGame = null;
    return;
  }
  
  socket.emit('leave_game', { gameId });
  currentGame = null;
};

// Get current game
export const getCurrentGame = (): Game | null => {
  return currentGame;
};

// Set game update callback
export const onGameUpdate = (callback: GameCallback): void => {
  gameUpdateCallback = callback;
  
  // If there's already a game, notify the callback immediately
  if (currentGame) {
    callback(currentGame);
  }
};

// Set game over callback
export const onGameOver = (callback: (winner: PlayerMark | 'DRAW') => void): void => {
  gameOverCallback = callback;
};

// Create a new game with AI
export const createAIGame = (username: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Game => {
  console.log(`Creating AI game with difficulty: ${difficulty}`);
  
  // Generate a unique ID for the game
  const gameId = 'ai-' + Math.random().toString(36).substr(2, 9);
  
  // Create a new game state
  const newGame: Game = {
    id: gameId,
    board: Array(9).fill(''),
    currentTurn: PlayerMark.X, // Player always starts as X
    players: {
      X: { id: 'player', username: username },
      O: { id: 'ai', username: `AI (${difficulty})` }
    },
    status: GameStatus.IN_PROGRESS,
    mode: GameMode.AI,
    aiDifficulty: difficulty
  };
  
  // Important: Update the current game state
  currentGame = newGame;
  
  // Save to localStorage in offline mode
  if (OFFLINE_MODE) {
    saveGameToLocalStorage();
  }
  
  // Notify the game update callback
  if (gameUpdateCallback) {
    console.log("Notifying game update callback with new AI game");
    gameUpdateCallback(newGame);
  }
  
  return newGame;
};

// Make a move in an AI game
export const makeAIMove = (position: number): void => {
  console.log(`Making AI move at position: ${position}`);
  
  if (!currentGame) {
    console.error("No current game found");
    return;
  }
  
  if (currentGame.mode !== GameMode.AI) {
    console.error("Current game is not an AI game");
    return;
  }
  
  if (currentGame.status !== GameStatus.IN_PROGRESS) {
    console.error(`Game is not in progress. Current status: ${currentGame.status}`);
    return;
  }
  
  // Check if the cell is empty
  if (currentGame.board[position]) {
    console.error(`Cell at position ${position} is already occupied with: ${currentGame.board[position]}`);
    return;
  }
  
  console.log("Player move is valid, updating game state");
  
  // Make the player's move
  const updatedGame = {
    ...currentGame,
    board: [...currentGame.board],
    currentTurn: PlayerMark.O
  };
  updatedGame.board[position] = PlayerMark.X;
  
  // Check for win or draw
  const winner = checkWinner(updatedGame.board);
  if (winner) {
    console.log(`Game over after player move. Winner: ${winner}`);
    updatedGame.status = GameStatus.FINISHED;
    updatedGame.winner = winner;
    currentGame = updatedGame;
    
    // Save to localStorage in offline mode
    if (OFFLINE_MODE) {
      saveGameToLocalStorage();
    }
    
    // Notify the callbacks
    if (gameUpdateCallback) {
      console.log("Notifying game update callback");
      gameUpdateCallback(updatedGame);
    }
    
    if (gameOverCallback) {
      console.log("Notifying game over callback");
      gameOverCallback(winner);
    }
    
    return;
  }
  
  // Update game state for player's move
  currentGame = updatedGame;
  
  // Save to localStorage in offline mode
  if (OFFLINE_MODE) {
    saveGameToLocalStorage();
  }
  
  if (gameUpdateCallback) {
    console.log("Notifying game update callback after player move");
    gameUpdateCallback(updatedGame);
  }
  
  // AI makes its move after a small delay (for better UX)
  console.log("Scheduling AI move");
  setTimeout(() => {
    if (!currentGame) {
      console.error("No current game found during AI turn");
      return;
    }
    
    if (currentGame.status !== GameStatus.IN_PROGRESS) {
      console.error(`Game is not in progress during AI turn. Current status: ${currentGame.status}`);
      return;
    }
    
    // Get AI move based on difficulty
    const aiPosition = getAIMove(currentGame.board, currentGame.aiDifficulty || 'medium');
    
    if (aiPosition === -1) {
      console.error("No valid moves available for AI");
      return; // No valid moves available
    }
    
    console.log(`AI choosing move at position: ${aiPosition}`);
    
    // Make the AI's move
    const aiMoveGame = {
      ...currentGame,
      board: [...currentGame.board],
      currentTurn: PlayerMark.X
    };
    aiMoveGame.board[aiPosition] = PlayerMark.O;
    
    // Check for win or draw again
    const aiWinner = checkWinner(aiMoveGame.board);
    if (aiWinner) {
      console.log(`Game over after AI move. Winner: ${aiWinner}`);
      aiMoveGame.status = GameStatus.FINISHED;
      aiMoveGame.winner = aiWinner;
      currentGame = aiMoveGame;
      
      // Save to localStorage in offline mode
      if (OFFLINE_MODE) {
        saveGameToLocalStorage();
      }
      
      // Notify the callbacks
      if (gameUpdateCallback) {
        console.log("Notifying game update callback after AI winning move");
        gameUpdateCallback(aiMoveGame);
      }
      
      if (gameOverCallback) {
        console.log("Notifying game over callback after AI winning move");
        gameOverCallback(aiWinner);
      }
      
      return;
    }
    
    // Update game state for AI's move
    currentGame = aiMoveGame;
    
    // Save to localStorage in offline mode
    if (OFFLINE_MODE) {
      saveGameToLocalStorage();
    }
    
    if (gameUpdateCallback) {
      console.log("Notifying game update callback after AI move");
      gameUpdateCallback(aiMoveGame);
    }
  }, 700); // Small delay for better user experience
};

// Check if there's a winner or a draw
const checkWinner = (board: string[]): PlayerMark | 'DRAW' | null => {
  // Winning combinations
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  
  // Check for winner
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as PlayerMark;
    }
  }
  
  // Check for draw (all cells filled)
  if (board.every(cell => cell !== '')) {
    return 'DRAW';
  }
  
  // No winner yet
  return null;
};

// Get AI move based on difficulty
const getAIMove = (board: string[], difficulty: 'easy' | 'medium' | 'hard'): number => {
  // Get all available cells
  const availableCells = board.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
  
  if (availableCells.length === 0) {
    return -1; // No moves available
  }
  
  switch (difficulty) {
    case 'easy':
      // Random move
      return availableCells[Math.floor(Math.random() * availableCells.length)];
    
    case 'hard':
      // Minimax algorithm (optimal play)
      return getBestMove(board);
    
    case 'medium':
    default:
      // 50% chance for optimal move, 50% chance for random move
      if (Math.random() < 0.5) {
        return getBestMove(board);
      } else {
        return availableCells[Math.floor(Math.random() * availableCells.length)];
      }
  }
};

// Get the best move using minimax algorithm
const getBestMove = (board: string[]): number => {
  let bestScore = -Infinity;
  let bestMove = -1;
  
  for (let i = 0; i < board.length; i++) {
    // Check if cell is empty
    if (board[i] === '') {
      // Try this move
      board[i] = PlayerMark.O;
      // Calculate score for this move
      const score = minimax(board, 0, false);
      // Undo the move
      board[i] = '';
      
      // Update best score and move if this is better
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  
  return bestMove;
};

// Minimax algorithm for finding the optimal move
const minimax = (board: string[], depth: number, isMaximizing: boolean): number => {
  // Check for terminal state
  const result = checkWinner(board);
  if (result) {
    if (result === PlayerMark.O) return 10 - depth; // AI wins
    if (result === PlayerMark.X) return depth - 10; // Player wins
    return 0; // Draw
  }
  
  if (isMaximizing) {
    // AI's turn (maximize score)
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') {
        board[i] = PlayerMark.O;
        const score = minimax(board, depth + 1, false);
        board[i] = '';
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    // Player's turn (minimize score)
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') {
        board[i] = PlayerMark.X;
        const score = minimax(board, depth + 1, true);
        board[i] = '';
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}; 