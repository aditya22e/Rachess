import { INITIAL_POSITIONS } from './constants';

export const initialBoard = Array(8).fill(null).map((_, rowIndex) => {
  if (INITIAL_POSITIONS[rowIndex]) {
    return INITIAL_POSITIONS[rowIndex].map(piece => ({ ...piece }));
  }
  return Array(8).fill(null);
});

// Enhanced move validation with comprehensive rules and bug fixes
export const isValidMove = (board, from, to, currentPlayer, gameState) => {
  // Basic validation
  if (!from || !to) return false;
  if (from.row === to.row && from.col === to.col) return false;
  
  const piece = board[from.row][from.col];
  if (!piece || piece.color !== currentPlayer) return false;

  const targetPiece = board[to.row][to.col];
  if (targetPiece && targetPiece.color === piece.color) return false;

  // Bounds checking
  if (to.row < 0 || to.row > 7 || to.col < 0 || to.col > 7) return false;

  let isValid = false;

  switch (piece.type) {
    case 'pawn':
      isValid = isValidPawnMove(board, from, to, piece.color, gameState);
      break;
    case 'rook':
      isValid = isValidRookMove(board, from, to);
      break;
    case 'bishop':
      isValid = isValidBishopMove(board, from, to);
      break;
    case 'queen':
      isValid = isValidQueenMove(board, from, to);
      break;
    case 'knight':
      isValid = isValidKnightMove(from, to);
      break;
    case 'king':
      isValid = isValidKingMove(board, from, to, piece.color, gameState);
      break;
    default:
      return false;
  }

  if (!isValid) return false;

  // Check if move puts own king in check
  const testBoard = makeMove(board, from, to, gameState);
  return !isInCheck(testBoard, currentPlayer);
};

// Fixed pawn movement validation
const isValidPawnMove = (board, from, to, color, gameState) => {
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absColDiff = Math.abs(colDiff);

  // Forward move
  if (absColDiff === 0) {
    // Single step forward
    if (rowDiff === direction && !board[to.row][to.col]) return true;
    
    // Double step from starting position
    if (from.row === startRow && rowDiff === 2 * direction && 
        !board[to.row][to.col] && !board[from.row + direction][from.col]) {
      return true;
    }
  }
  
  // Diagonal capture
  if (absColDiff === 1 && rowDiff === direction) {
    // Regular capture
    if (board[to.row][to.col] && board[to.row][to.col].color !== color) {
      return true;
    }
    
    // En passant capture - fixed validation
    if (gameState && gameState.enPassantTarget && 
        to.row === gameState.enPassantTarget.row && 
        to.col === gameState.enPassantTarget.col) {
      const capturedPawnRow = color === 'white' ? to.row + 1 : to.row - 1;
      const capturedPawn = board[capturedPawnRow] && board[capturedPawnRow][to.col];
      return capturedPawn && capturedPawn.type === 'pawn' && capturedPawn.color !== color;
    }
  }

  return false;
};

// Fixed rook movement with proper path checking
const isValidRookMove = (board, from, to) => {
  if (from.row !== to.row && from.col !== to.col) return false;
  return isPathClear(board, from, to);
};

// Fixed bishop movement
const isValidBishopMove = (board, from, to) => {
  if (Math.abs(from.row - to.row) !== Math.abs(from.col - to.col)) return false;
  return isPathClear(board, from, to);
};

// Queen combines rook and bishop moves
const isValidQueenMove = (board, from, to) => {
  return isValidRookMove(board, from, to) || isValidBishopMove(board, from, to);
};

// Knight movement (L-shape)
const isValidKnightMove = (from, to) => {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
};

// Fixed king movement with castling
const isValidKingMove = (board, from, to, color, gameState) => {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  
  // Normal king move (one square in any direction)
  if (rowDiff <= 1 && colDiff <= 1) return true;
  
  // Castling (king moves 2 squares horizontally)
  if (rowDiff === 0 && colDiff === 2) {
    return canCastle(board, from, to, color, gameState);
  }
  
  return false;
};

// Fixed castling validation
const canCastle = (board, from, to, color, gameState) => {
  if (!gameState) return false;
  
  // Check if king has moved
  if (gameState.kingMoved && gameState.kingMoved[color]) return false;
  
  const isKingSide = to.col > from.col;
  const rookCol = isKingSide ? 7 : 0;
  const rookMoveKey = `${color}-${rookCol}`;
  
  // Check if rook has moved
  if (gameState.rookMoved && gameState.rookMoved[rookMoveKey]) return false;
  
  // Check if rook exists
  const rook = board[from.row][rookCol];
  if (!rook || rook.type !== 'rook' || rook.color !== color) return false;
  
  // Check if path between king and rook is clear
  const start = Math.min(from.col, rookCol) + 1;
  const end = Math.max(from.col, rookCol);
  for (let col = start; col < end; col++) {
    if (board[from.row][col]) return false;
  }
  
  // King cannot be in check before castling
  if (isInCheck(board, color)) return false;
  
  // King cannot pass through or end in check
  const step = isKingSide ? 1 : -1;
  for (let i = 1; i <= 2; i++) {
    const newCol = from.col + i * step;
    const testBoard = deepCopyBoard(board);
    testBoard[from.row][newCol] = testBoard[from.row][from.col];
    testBoard[from.row][from.col] = null;
    if (isInCheck(testBoard, color)) return false;
  }
  
  return true;
};

// Fixed path checking with bounds validation
const isPathClear = (board, from, to) => {
  const rowStep = Math.sign(to.row - from.row);
  const colStep = Math.sign(to.col - from.col);
  
  let currentRow = from.row + rowStep;
  let currentCol = from.col + colStep;
  
  while (currentRow !== to.row || currentCol !== to.col) {
    // Bounds checking to prevent infinite loops
    if (currentRow < 0 || currentRow > 7 || currentCol < 0 || currentCol > 7) {
      return false;
    }
    
    if (board[currentRow][currentCol]) return false;
    
    currentRow += rowStep;
    currentCol += colStep;
  }
  
  return true;
};

// Fixed deep copy function
const deepCopyBoard = (board) => {
  return board.map(row => 
    row.map(piece => piece ? { ...piece } : null)
  );
};

// Fixed move execution with proper state handling
export const makeMove = (board, from, to, gameState = {}) => {
  const newBoard = deepCopyBoard(board);
  const piece = newBoard[from.row][from.col];
  
  if (!piece) return newBoard;
  
  const targetPiece = newBoard[to.row][to.col];
  
  // Handle en passant capture
  if (piece.type === 'pawn' && !targetPiece && Math.abs(to.col - from.col) === 1) {
    if (gameState.enPassantTarget && 
        to.row === gameState.enPassantTarget.row && 
        to.col === gameState.enPassantTarget.col) {
      const capturedPawnRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
      if (newBoard[capturedPawnRow] && newBoard[capturedPawnRow][to.col]) {
        newBoard[capturedPawnRow][to.col] = null;
      }
    }
  }
  
  // Handle castling - move the rook
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    const isKingSide = to.col > from.col;
    const rookFromCol = isKingSide ? 7 : 0;
    const rookToCol = isKingSide ? 5 : 3;
    
    // Move rook
    if (newBoard[from.row][rookFromCol]) {
      newBoard[from.row][rookToCol] = { ...newBoard[from.row][rookFromCol] };
      newBoard[from.row][rookFromCol] = null;
    }
  }
  
  // Handle pawn promotion
  if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
    newBoard[to.row][to.col] = { ...piece, type: 'queen' };
  } else {
    newBoard[to.row][to.col] = { ...piece };
  }
  
  newBoard[from.row][from.col] = null;
  return newBoard;
};

// Get all valid moves for a piece
export const getValidMoves = (board, position, gameState) => {
  const validMoves = [];
  const piece = board[position.row][position.col];
  
  if (!piece) return validMoves;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isValidMove(board, position, { row, col }, piece.color, gameState)) {
        validMoves.push({ row, col });
      }
    }
  }
  
  return validMoves;
};

// Fixed check detection with performance optimization
export const isInCheck = (board, color) => {
  let kingPosition = null;
  
  // Find king position efficiently
  outerLoop: for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        kingPosition = { row, col };
        break outerLoop;
      }
    }
  }

  if (!kingPosition) return false;

  const opponentColor = color === 'white' ? 'black' : 'white';
  
  // Check if any opponent piece can attack the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        if (canPieceAttack(board, { row, col }, kingPosition)) {
          return true;
        }
      }
    }
  }

  return false;
};

// Fixed piece attack validation
const canPieceAttack = (board, from, to) => {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  
  switch (piece.type) {
    case 'pawn': {
      const direction = piece.color === 'white' ? -1 : 1;
      const rowDiff = to.row - from.row;
      const colDiff = Math.abs(to.col - from.col);
      return colDiff === 1 && rowDiff === direction;
    }
    case 'rook':
      return isValidRookMove(board, from, to);
    case 'bishop':
      return isValidBishopMove(board, from, to);
    case 'queen':
      return isValidQueenMove(board, from, to);
    case 'knight':
      return isValidKnightMove(from, to);
    case 'king': {
      const rowDiff = Math.abs(from.row - to.row);
      const colDiff = Math.abs(from.col - to.col);
      return rowDiff <= 1 && colDiff <= 1;
    }
    default:
      return false;
  }
};

// Fixed checkmate detection
export const isCheckmate = (board, color, gameState) => {
  if (!isInCheck(board, color)) return false;
  
  // Check if any piece of this color has a valid move
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, { row, col }, gameState);
        if (validMoves.length > 0) return false;
      }
    }
  }
  
  return true;
};

// Stalemate detection
export const isStalemate = (board, color, gameState) => {
  // Not in check but no valid moves
  if (isInCheck(board, color)) return false;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, { row, col }, gameState);
        if (validMoves.length > 0) return false;
      }
    }
  }
  
  return true;
};

// Fixed game state update
export const updateGameState = (gameState, board, from, to) => {
  const newGameState = { ...gameState };
  const piece = board[from.row][from.col];
  
  if (!piece) return newGameState;
  
  // Initialize nested objects if they don't exist
  if (!newGameState.kingMoved) newGameState.kingMoved = { white: false, black: false };
  if (!newGameState.rookMoved) {
    newGameState.rookMoved = {
      'white-0': false, 'white-7': false,
      'black-0': false, 'black-7': false
    };
  }
  
  // Reset en passant target
  newGameState.enPassantTarget = null;
  
  // Set en passant target for pawn double moves
  if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
    newGameState.enPassantTarget = {
      row: from.row + (to.row - from.row) / 2,
      col: from.col
    };
  }
  
  // Track king movement
  if (piece.type === 'king') {
    newGameState.kingMoved[piece.color] = true;
  }
  
  // Track rook movement
  if (piece.type === 'rook') {
    newGameState.rookMoved[`${piece.color}-${from.col}`] = true;
  }
  
  // Update move counters
  if (!newGameState.halfMoveClock) newGameState.halfMoveClock = 0;
  if (!newGameState.fullMoveNumber) newGameState.fullMoveNumber = 1;
  
  // Reset half-move clock on pawn move or capture
  if (piece.type === 'pawn' || board[to.row][to.col]) {
    newGameState.halfMoveClock = 0;
  } else {
    newGameState.halfMoveClock++;
  }
  
  // Increment full move number after black's turn
  if (piece.color === 'black') {
    newGameState.fullMoveNumber++;
  }
  
  return newGameState;
};

// Board validation utility (for debugging)
export const validateBoard = (board) => {
  if (!Array.isArray(board) || board.length !== 8) return false;
  
  let whiteKing = 0, blackKing = 0;
  
  for (let row = 0; row < 8; row++) {
    if (!Array.isArray(board[row]) || board[row].length !== 8) return false;
    
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (!piece.color || !piece.type) return false;
        if (piece.type === 'king') {
          if (piece.color === 'white') whiteKing++;
          else if (piece.color === 'black') blackKing++;
        }
      }
    }
  }
  
  return whiteKing === 1 && blackKing === 1;
};
