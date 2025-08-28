import React from 'react';
import Piece from './Piece';
import './Square.css';

const Square = ({ 
  piece, 
  isSelected, 
  isHighlighted, 
  isInCheck, 
  isDark, 
  position, 
  onClick 
}) => {
  const squareClass = `square ${isDark ? 'dark' : 'light'} ${
    isSelected ? 'selected' : ''
  } ${isHighlighted ? 'highlighted' : ''} ${isInCheck ? 'check' : ''}`;

  return (
    <div className={squareClass} onClick={onClick}>
      {piece && <Piece piece={piece} />}
      {isHighlighted && !piece && <div className="move-indicator" />}
      {isHighlighted && piece && <div className="capture-indicator" />}
    </div>
  );
};

export default Square;
