import { Socket } from 'socket.io';

// Player types
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
}

// Active games map
const activeGames: Map<string, Game> = new Map();

// Create a new game
export const createGame = (playerId: string, username: string): Game => {
  const gameId = generateGameId();
  
  const newGame: Game = {
    id: gameId,
    board: Array(9).fill(''),
    currentTurn: PlayerMark.X,
    players: {
      X: { id: playerId, username },
    },
    status: GameStatus.WAITING,
  };
  
  activeGames.set(gameId, newGame);
  return newGame;
};

// Join an existing game
export const joinGame = (gameId: string, playerId: string, username: string): Game | null => {
  const game = activeGames.get(gameId);
  
  if (!game || game.status !== GameStatus.WAITING) {
    return null;
  }
  
  // Assign player as O
  game.players.O = { id: playerId, username };
  game.status = GameStatus.IN_PROGRESS;
  
  activeGames.set(gameId, game);
  return game;
};

// Make a move
export const makeMove = (gameId: string, playerId: string, position: number): Game | null => {
  const game = activeGames.get(gameId);
  
  if (!game || game.status !== GameStatus.IN_PROGRESS) {
    return null;
  }
  
  // Check if it's the player's turn
  const playerMark = getPlayerMark(game, playerId);
  if (!playerMark || playerMark !== game.currentTurn) {
    return null;
  }
  
  // Check if the position is valid
  if (position < 0 || position > 8 || game.board[position] !== '') {
    return null;
  }
  
  // Make the move
  game.board[position] = playerMark;
  
  // Check for win or draw
  const result = checkGameResult(game.board);
  
  if (result) {
    game.status = GameStatus.FINISHED;
    game.winner = result;
  } else {
    // Switch turns
    game.currentTurn = game.currentTurn === PlayerMark.X ? PlayerMark.O : PlayerMark.X;
  }
  
  activeGames.set(gameId, game);
  return game;
};

// Get a game by ID
export const getGame = (gameId: string): Game | undefined => {
  return activeGames.get(gameId);
};

// Helper function to get player mark
const getPlayerMark = (game: Game, playerId: string): PlayerMark | null => {
  if (game.players.X?.id === playerId) return PlayerMark.X;
  if (game.players.O?.id === playerId) return PlayerMark.O;
  return null;
};

// Generate a random game ID
const generateGameId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Check if the game is won or drawn
const checkGameResult = (board: string[]): PlayerMark | 'DRAW' | null => {
  // Winning patterns
  const patterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  
  // Check for winning patterns
  for (const pattern of patterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as PlayerMark;
    }
  }
  
  // Check for draw
  if (board.every(cell => cell !== '')) {
    return 'DRAW';
  }
  
  return null;
};

// Set up socket handlers for game events
export const setupGameHandlers = (io: any, socket: Socket) => {
  // Create a new game
  socket.on('create_game', ({ username }, callback) => {
    const game = createGame(socket.id, username);
    
    // Join the socket to a room with the game ID
    socket.join(game.id);
    
    callback({ success: true, game });
  });
  
  // Join an existing game
  socket.on('join_game', ({ gameId, username }, callback) => {
    const game = joinGame(gameId, socket.id, username);
    
    if (!game) {
      return callback({ success: false, error: 'Game not found or already full' });
    }
    
    // Join the socket to the game room
    socket.join(game.id);
    
    // Notify all players in the room
    io.to(game.id).emit('game_update', game);
    
    callback({ success: true, game });
  });
  
  // Make a move
  socket.on('make_move', ({ gameId, position }, callback) => {
    const updatedGame = makeMove(gameId, socket.id, position);
    
    if (!updatedGame) {
      return callback({ success: false, error: 'Invalid move' });
    }
    
    // Notify all players in the room about the game update
    io.to(gameId).emit('game_update', updatedGame);
    
    // If game is finished, notify about the result
    if (updatedGame.status === GameStatus.FINISHED) {
      io.to(gameId).emit('game_over', {
        winner: updatedGame.winner
      });
    }
    
    callback({ success: true, game: updatedGame });
  });
  
  // Leave the game
  socket.on('leave_game', ({ gameId }) => {
    socket.leave(gameId);
    // Here we could add logic to handle player disconnections
  });
}; 