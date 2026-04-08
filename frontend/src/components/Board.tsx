import { useState, useCallback } from 'react';

const BOARD_SIZE = 8;
const COLORS = [
  '#4a7dff', '#ff6b6b', '#ffd200', '#4ade80',
  '#c084fc', '#fb923c', '#22d3ee', '#f472b6',
];

function cellColor(r: number, c: number): string {
  return COLORS[(r * 3 + c * 7) % COLORS.length];
}

interface BoardProps {
  board: number[][];
  selectedShape: number[][] | null;
  selectedColor: string;
  onCellClick: (row: number, col: number) => void;
}

export default function Board({ board, selectedShape, selectedColor, onCellClick }: BoardProps) {
  const [ghost, setGhost] = useState<{ cells: [number, number][]; valid: boolean } | null>(null);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (!selectedShape || selectedShape.length === 0) {
      setGhost(null);
      return;
    }

    let valid = true;
    const cells: [number, number][] = [];

    for (let r = 0; r < selectedShape.length; r++) {
      for (let c = 0; c < selectedShape[r].length; c++) {
        if (!selectedShape[r][c]) continue;
        const br = row + r;
        const bc = col + c;
        cells.push([br, bc]);
        if (br >= BOARD_SIZE || bc >= BOARD_SIZE || board[br]?.[bc]) {
          valid = false;
        }
      }
    }

    setGhost({ cells, valid });
  }, [selectedShape, board]);

  const handleMouseLeave = useCallback(() => setGhost(null), []);

  const ghostSet = new Set(ghost?.cells.map(([r, c]) => `${r},${c}`) ?? []);

  return (
    <div className="board">
      {Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => {
          const filled = (board && board[r] && board[r][c] === 1) || false;
          const isGhost = ghostSet.has(`${r},${c}`);
          const ghostValid = ghost?.valid ?? false;

          let className = 'cell';
          if (filled) className += ' filled';
          else if (isGhost) className += ghostValid ? ' ghost' : ' ghost-invalid';

          const style: React.CSSProperties = {};
          if (filled) {
            style.background = cellColor(r, c);
          } else if (isGhost && ghostValid) {
            style.background = selectedColor + '40';
          }

          return (
            <div
              key={`${r}-${c}`}
              className={className}
              style={style}
              onClick={() => onCellClick(r, c)}
              onMouseEnter={() => handleMouseEnter(r, c)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })
      )}
    </div>
  );
}
