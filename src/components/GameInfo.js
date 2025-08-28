import React from 'react';
import './GameInfo.css';

const GameInfo = ({ 
  currentPlayer, 
  gameStatus, 
  moveHistory, 
  onReset, 
  isInCheck 
}) => {
  return (
    <div className="game-info">
      <div className="game-status">
        <h2>Chesserdotcom</h2>
        <div className="current-turn">
          <strong>Current Turn: </strong>
          <span className={`player ${currentPlayer}`}>
            {currentPlayer === 'white' ? 'White' : 'Black'}
          </span>
          {isInCheck && <span className="check-warning"> (In Check!)</span>}
        </div>
        <div className="game-state">
          <strong>Status: </strong>
          <span className={gameStatus !== 'active' ? 'game-over' : ''}>
            {gameStatus === 'active' ? 'Game in progress' : gameStatus}
          </span>
        </div>
        <button className="reset-button" onClick={onReset}>
          Rookie?
        </button>
      </div>
      
      <div className="move-history">
        <h3>Move History</h3>
        <div className="moves-container">
          {moveHistory.length === 0 ? (
            <p>No moves yet</p>
          ) : (
            <div className="moves-list">
              {moveHistory.map((move, index) => (
                <div key={index} className="move-item">
                  <span className="move-number">{Math.floor(index / 2) + 1}.</span>
                  <span className="move-notation">{move}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
