import React, { useState, useCallback } from 'react';
import Square from './Square';
import GameInfo from './GameInfo';
import { 
  initialBoard, 
  isValidMove, 
  makeMove, 
  isInCheck, 
  isCheckmate, 
  isStalemate,
  getValidMoves,
  updateGameState
} from '../utils/gameLogic';
import './Board.css';

const Board = () => {
  const [board, setBoard] = useState(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [gameStatus, setGameStatus] = useState('active');
  const [validMoves, setValidMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameState, setGameState] = useState({
    kingMoved: { white: false, black: false },
    rookMoved: { 'white-0': false, 'white-7': false, 'black-0': false, 'black-7': false },
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1
  });

  const handleSquareClick = useCallback((row, col) => {
    if (gameStatus !== 'active') return;

    if (selectedSquare) {
      // Attempt to make a move
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const piece = board[selectedSquare.row][selectedSquare.col];
      if (piece && piece.color === currentPlayer) {
        if (isValidMove(board, selectedSquare, { row, col }, currentPlayer, gameState)) {
          const newBoard = makeMove(board, selectedSquare, { row, col }, gameState);
          const newGameState = updateGameState(gameState, board, selectedSquare, { row, col });
          
          setBoard(newBoard);
          setGameState(newGameState);
          
          // Add to move history
          const moveNotation = `${piece.type}${String.fromCharCode(97 + selectedSquare.col)}${8 - selectedSquare.row}${String.fromCharCode(97 + col)}${8 - row}`;
          setMoveHistory(prev => [...prev, moveNotation]);
          
          const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
          setCurrentPlayer(nextPlayer);
          setSelectedSquare(null);
          setValidMoves([]);
          
          // Check game end conditions
          setTimeout(() => checkGameStatus(newBoard, nextPlayer, newGameState), 10);
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // Select a square
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        const moves = getValidMoves(board, { row, col }, gameState);
        setValidMoves(moves);
      }
    }
  }, [board, selectedSquare, currentPlayer, gameStatus, gameState]);

  const checkGameStatus = (board, nextPlayer, gameState) => {
    if (isCheckmate(board, nextPlayer, gameState)) {
      setGameStatus(`${currentPlayer === 'white' ? 'White' : 'Black'} wins by checkmate!`);
    } else if (isStalemate(board, nextPlayer, gameState)) {
      setGameStatus('Draw by stalemate!');
    } else if (gameState.halfMoveClock >= 50) {
      setGameStatus('Draw by 50-move rule!');
    }
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setSelectedSquare(null);
    setCurrentPlayer('white');
    setGameStatus('active');
    setValidMoves([]);
    setMoveHistory([]);
    setGameState({
      kingMoved: { white: false, black: false },
      rookMoved: { 'white-0': false, 'white-7': false, 'black-0': false, 'black-7': false },
      enPassantTarget: null,
      halfMoveClock: 0,
      fullMoveNumber: 1
    });
  };

  const isSquareHighlighted = (row, col) => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  const isInCheckSquare = (row, col) => {
    const piece = board[row][col];
    return piece && piece.type === 'king' && isInCheck(board, piece.color);
  };

  return (
    <div className="chess-game">
      <GameInfo 
        currentPlayer={currentPlayer}
        gameStatus={gameStatus}
        moveHistory={moveHistory}
        onReset={resetGame}
        isInCheck={isInCheck(board, currentPlayer)}
      />
      <div className="chess-board">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => (
            <Square
              key={`${rowIndex}-${colIndex}`}
              piece={piece}
              isSelected={
                selectedSquare &&
                selectedSquare.row === rowIndex &&
                selectedSquare.col === colIndex
              }
              isHighlighted={isSquareHighlighted(rowIndex, colIndex)}
              isInCheck={isInCheckSquare(rowIndex, colIndex)}
              isDark={(rowIndex + colIndex) % 2 === 1}
              position={{ row: rowIndex, col: colIndex }}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Board;
