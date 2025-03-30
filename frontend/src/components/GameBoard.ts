import { Game, GameStatus, PlayerMark } from '../services/gameService';
import { getAuthState } from '../services/authService';
import { OFFLINE_MODE } from '../config';

// Render the game board
export const renderGameBoard = (container: HTMLElement, game: Game, onCellClick: (position: number) => void): void => {
  console.log("Rendering game board", { 
    gameId: game.id, 
    mode: game.mode, 
    status: game.status,
    currentTurn: game.currentTurn,
    board: game.board,
    offlineMode: OFFLINE_MODE
  });
  
  // Determine if the current user can make a move
  const { user } = getAuthState();
  
  // In offline mode, allow moves regardless of whose turn it is
  const isPlayerTurn = 
    OFFLINE_MODE ||
    (game.currentTurn === PlayerMark.X && game.players.X?.id === user?.id) ||
    (game.currentTurn === PlayerMark.O && game.players.O?.id === user?.id) ||
    // For AI games, the player is always X
    (game.mode === 'ai' && game.currentTurn === PlayerMark.X);
  
  const isGameActive = game.status === GameStatus.IN_PROGRESS;
  const canInteract = isGameActive && isPlayerTurn;
  
  console.log("Interaction state", { isPlayerTurn, isGameActive, canInteract, offlineMode: OFFLINE_MODE });
  
  // Calculate winning cells if the game is finished and there's a winner
  const winningCells: number[] = [];
  if (game.status === GameStatus.FINISHED && game.winner && game.winner !== 'DRAW') {
    winningCells.push(...calculateWinningCells(game.board, game.winner));
  }

  // Render the board
  container.innerHTML = `
    <div class="card">
      <div class="game-board">
        ${game.board.map((cell, index) => {
          const cellValue = cell || '';
          const isWinningCell = winningCells.includes(index);
          const cellClass = `
            cell 
            ${isWinningCell ? 'winning-cell' : ''} 
            ${cellValue ? (cellValue === PlayerMark.X ? 'x-mark' : 'o-mark') : ''} 
            ${!cellValue && canInteract ? 'cursor-pointer' : 'cursor-default'}
          `.trim();
          
          return `
            <div 
              class="${cellClass}" 
              data-index="${index}"
              ${!cellValue && canInteract ? 'role="button"' : ''}
            >
              ${cellValue === PlayerMark.X 
                ? 'X'
                : cellValue === PlayerMark.O 
                  ? 'O'
                  : ''}
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="mt-6 text-center">
        <div class="card inline-block p-3">
          <div class="flex items-center space-x-8">
            <div class="flex items-center">
              <span class="font-title text-primary">${game.players.X?.username || 'Player X'}</span>
              <span class="text-xl text-primary mx-2">X</span>
            </div>
            <div class="font-bold">VS</div>
            <div class="flex items-center">
              <span class="text-xl text-secondary mx-2">O</span>
              <span class="font-title text-secondary">${game.players.O?.username || 'Player O'}</span>
            </div>
          </div>
        </div>
        ${OFFLINE_MODE ? `
        <div class="offline-indicator mt-3">
          Offline Mode: ${game.currentTurn === PlayerMark.X ? 'X' : 'O'}'s turn
        </div>
        ` : ''}
      </div>
    </div>
  `;
  
  // Add click event listeners to cells
  if (canInteract) {
    console.log("Adding click event listeners to cells");
    const cells = container.querySelectorAll('.cell[role="button"]');
    console.log(`Found ${cells.length} clickable cells`);
    
    cells.forEach(cell => {
      cell.addEventListener('click', (event) => {
        const index = parseInt((cell as HTMLElement).dataset.index || '0', 10);
        console.log(`Cell clicked: ${index}`);
        onCellClick(index);
      });
    });
  } else {
    console.log("Not adding click listeners - cannot interact");
  }
};

// Helper function to calculate the winning cells
const calculateWinningCells = (board: string[], winner: PlayerMark): number[] => {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] === winner && board[b] === winner && board[c] === winner) {
      return pattern;
    }
  }
  
  return [];
}; 