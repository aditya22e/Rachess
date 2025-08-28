import React from 'react';
import { PIECE_SYMBOLS } from '../utils/constants';

const Piece = ({ piece }) => {
  if (!piece) return null;

  const symbol = PIECE_SYMBOLS[piece.color][piece.type];
  
  return (
    <div className={`piece ${piece.color} ${piece.type}`}>
      <span className="piece-symbol">{symbol}</span>
    </div>
  );
};

export default Piece;
