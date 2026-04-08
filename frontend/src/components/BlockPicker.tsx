const BLOCK_COLORS = ['#4a7dff', '#ff6b6b', '#ffd200', '#4ade80', '#c084fc', '#fb923c', '#22d3ee', '#f472b6'];

interface BlockPickerProps {
  blocks: number[][][];
  selectedIndex: number | null;
  colorIndices: number[];
  onSelect: (index: number) => void;
}

export function getBlockColor(colorIndex: number): string {
  return BLOCK_COLORS[colorIndex % BLOCK_COLORS.length];
}

export default function BlockPicker({ blocks, selectedIndex, colorIndices, onSelect }: BlockPickerProps) {
  return (
    <div className="blocks-area">
      {blocks.map((shape, idx) => {
        const used = !shape || shape.length === 0;
        const selected = idx === selectedIndex;
        let className = 'block-slot';
        if (used) className += ' used';
        if (selected) className += ' selected';

        const color = getBlockColor(colorIndices[idx]);

        return (
          <div
            key={idx}
            className={className}
            onClick={() => !used && onSelect(idx)}
          >
            {!used && shape.length > 0 ? (
              <div
                className="block-grid"
                style={{ gridTemplateColumns: `repeat(${shape[0].length}, 18px)` }}
              >
                {shape.flat().map((cell, i) => (
                  <div
                    key={i}
                    className={`block-cell ${cell ? 'on' : ''}`}
                    style={cell ? { background: color } : undefined}
                  />
                ))}
              </div>
            ) : (
              <div style={{ width: 40, height: 40 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
