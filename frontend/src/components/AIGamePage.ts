import { getAuthState } from '../services/authService';
import { createAIGame, makeAIMove, GameStatus, PlayerMark, Game, onGameUpdate, onGameOver } from '../services/gameService';
import { renderHomePage } from './HomePage';
import { renderGameBoard } from './GameBoard';

// Render AI game page
export const renderAIGamePage = (container: HTMLElement, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void => {
  const { user } = getAuthState();
  
  if (!user) {
    // User not logged in, redirect to home
    renderHomePage(container);
    return;
  }
  
  // Create AI game
  const game = createAIGame(user.username, difficulty);
  console.log("AI game created:", game);
  
  // Render initial game UI
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
          <h1>Tic-Tac-Toe vs AI</h1>
          <div id="game-status" class="text-lg font-handwritten">
            <div class="text-primary">
              Your turn to move! You are playing as X.
            </div>
          </div>
          <div class="mt-2">
            <span class="text-sm font-handwritten highlight px-2 py-1">AI Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div id="game-board-container" class="lg:col-span-2">
            <!-- Game board will be rendered here -->
          </div>
          
          <div id="game-info-container" class="lg:col-span-1">
            <div class="card p-4">
              <h3 class="font-title text-lg mb-4">Game Info</h3>
              <div class="space-y-2 font-handwritten">
                <div class="flex justify-between py-1 border-b">
                  <span>Player:</span>
                  <span class="font-title text-primary">${user.username} (X)</span>
                </div>
                <div class="flex justify-between py-1 border-b">
                  <span>Opponent:</span>
                  <span class="font-title text-secondary">AI ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} (O)</span>
                </div>
                <div class="flex justify-between py-1">
                  <span>Status:</span>
                  <span class="text-primary">In Progress</span>
                </div>
              </div>
              
              <div class="mt-6">
                <button id="new-ai-game-btn" class="btn btn-primary w-full">
                  Start New Game
                </button>
              </div>
              
              <div class="mt-4 text-center">
                <button id="change-difficulty-btn" class="btn btn-secondary">
                  Change Difficulty
                </button>
              </div>
              
              <div id="difficulty-selector" class="mt-4 hidden">
                <label class="block text-sm font-handwritten mb-1">Select New Difficulty:</label>
                <div class="flex space-x-2">
                  <select id="new-ai-difficulty" class="input flex-grow">
                    <option value="easy" ${difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                    <option value="medium" ${difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="hard" ${difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                  </select>
                  <button id="apply-difficulty-btn" class="btn btn-primary">Apply</button>
                </div>
              </div>
            </div>
            
            <div class="card p-4 mt-4">
              <h3 class="font-title text-lg mb-2">How to Play</h3>
              <p class="font-handwritten">Click on any empty cell to make your move. Try to get three X's in a row, column, or diagonal before the AI gets three O's.</p>
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
      renderHomePage(container);
    });
  }
  
  // Get game board container
  const gameBoardContainer = document.getElementById('game-board-container');
  const gameStatusElement = document.getElementById('game-status');
  
  if (!gameBoardContainer || !gameStatusElement) {
    console.error('Game page containers not found!');
    return;
  }
  
  // New game button event listener
  const newGameBtn = document.getElementById('new-ai-game-btn');
  if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
      renderAIGamePage(container, difficulty);
    });
  }
  
  // Change difficulty button event listener
  const changeDifficultyBtn = document.getElementById('change-difficulty-btn');
  const difficultySelector = document.getElementById('difficulty-selector');
  if (changeDifficultyBtn && difficultySelector) {
    changeDifficultyBtn.addEventListener('click', () => {
      difficultySelector.classList.toggle('hidden');
    });
  }
  
  // Apply difficulty button event listener
  const applyDifficultyBtn = document.getElementById('apply-difficulty-btn');
  const newAiDifficultySelect = document.getElementById('new-ai-difficulty') as HTMLSelectElement;
  if (applyDifficultyBtn && newAiDifficultySelect) {
    applyDifficultyBtn.addEventListener('click', () => {
      const newDifficulty = newAiDifficultySelect.value as 'easy' | 'medium' | 'hard';
      renderAIGamePage(container, newDifficulty);
    });
  }
  
  // Setup game update callback
  const updateGameCallback = (updatedGame: Game) => {
    if (updatedGame.mode === 'ai') {
      console.log("Game update received in AI game page:", updatedGame);
      updateAIGameUI(gameBoardContainer, gameStatusElement, updatedGame);
    }
  };
  
  // Setup game over callback
  const gameOverCallback = (winner: PlayerMark | 'DRAW') => {
    console.log("Game over in AI game:", winner);
  };
  
  // Register callbacks
  onGameUpdate(updateGameCallback);
  onGameOver(gameOverCallback);
  
  // Render the initial game board
  updateAIGameUI(gameBoardContainer, gameStatusElement, game);
};

// Update AI game UI
const updateAIGameUI = (
  gameBoardContainer: HTMLElement,
  gameStatusElement: HTMLElement,
  game: Game
): void => {
  // Update game status message
  let statusMessage = '';
  
  if (game.status === GameStatus.IN_PROGRESS) {
    if (game.currentTurn === PlayerMark.X) {
      statusMessage = `
        <div class="text-primary">
          Your turn to move! You are playing as X.
        </div>
      `;
    } else {
      statusMessage = `
        <div class="text-secondary">
          AI is thinking... Wait for its move.
        </div>
      `;
    }
  } else if (game.status === GameStatus.FINISHED) {
    if (game.winner === PlayerMark.X) {
      statusMessage = `
        <div class="text-success">
          Congratulations! You won the game!
        </div>
      `;
    } else if (game.winner === PlayerMark.O) {
      statusMessage = `
        <div class="text-error">
          The AI has won the game. Better luck next time!
        </div>
      `;
    } else {
      statusMessage = `
        <div class="text-secondary">
          The game ended in a draw!
        </div>
      `;
    }
  }
  
  gameStatusElement.innerHTML = statusMessage;
  
  // Render the game board with click handler
  renderGameBoard(gameBoardContainer, game, onCellClick);
};

// Handle cell click
const onCellClick = (position: number): void => {
  console.log(`Cell clicked: ${position}`);
  // Make the move directly
  makeAIMove(position);
}; 