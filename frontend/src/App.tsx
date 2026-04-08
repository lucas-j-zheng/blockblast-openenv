import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { useWebSocket } from './hooks/useWebSocket';
import Board from './components/Board';
import BlockPicker, { getBlockColor } from './components/BlockPicker';

function App() {
  const { connected, obs, reset, step } = useWebSocket();
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [scoreBump, setScoreBump] = useState(false);
  const [clearBanner, setClearBanner] = useState<string | null>(null);
  const [rewardPopups, setRewardPopups] = useState<{ id: number; value: number; x: number; y: number }[]>([]);
  const [stepCount, setStepCount] = useState(0);
  const popupId = useRef(0);
  const [colorIndices, setColorIndices] = useState([0, 1, 2]);
  const prevObsRef = useRef(obs);

  // Handle new observations
  useEffect(() => {
    if (!obs) return;
    const prev = prevObsRef.current;
    prevObsRef.current = obs;

    // Score bump
    if (prev && obs.score !== prev.score) {
      setScoreBump(true);
      setTimeout(() => setScoreBump(false), 150);
    }

    // Step count
    if (prev && obs !== prev) {
      setStepCount(s => s + 1);
    }

    // Clear banner
    if (obs.lines_cleared > 0) {
      const labels = ['', 'Line Clear!', 'Double Clear!', 'Triple Clear!', 'QUAD CLEAR!'];
      setClearBanner(labels[Math.min(obs.lines_cleared, 4)] || `${obs.lines_cleared}x CLEAR!`);
      setTimeout(() => setClearBanner(null), 700);
    }

    // Reward popup
    if (prev && obs.reward && obs.reward !== 0 && obs.reward !== -1) {
      const id = ++popupId.current;
      setRewardPopups(p => [...p, {
        id,
        value: obs.reward,
        x: 100 + Math.random() * 250,
        y: 80 + Math.random() * 250,
      }]);
      setTimeout(() => setRewardPopups(p => p.filter(pp => pp.id !== id)), 800);
    }

    // Auto-select first available block
    if (selectedBlock === null || !obs.available_blocks[selectedBlock] || obs.available_blocks[selectedBlock].length === 0) {
      const first = obs.available_blocks.findIndex(b => b && b.length > 0);
      setSelectedBlock(first >= 0 ? first : null);
    }

    // Refresh colors when new block set is generated (blocks_remaining goes back to 3)
    if (prev && obs.blocks_remaining === 3 && prev.blocks_remaining < 3) {
      setColorIndices([
        Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 8),
      ]);
    }
  }, [obs, selectedBlock]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedBlock(null);
    setStepCount(0);
    setColorIndices([
      Math.floor(Math.random() * 8),
      Math.floor(Math.random() * 8),
      Math.floor(Math.random() * 8),
    ]);
  }, [reset]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (selectedBlock === null || !obs || obs.game_over) return;
    step(selectedBlock, row, col);
  }, [selectedBlock, obs, step]);

  if (!obs) {
    return (
      <div className="game">
        <div className="status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span>{connected ? 'Connected, loading...' : 'Connecting...'}</span>
        </div>
      </div>
    );
  }

  const selectedShape = selectedBlock !== null ? obs.available_blocks[selectedBlock] : null;
  const selectedColor = selectedBlock !== null ? getBlockColor(colorIndices[selectedBlock]) : '#fff';

  return (
    <div className="game">
      <div className="score-area">
        <div className="score-label">Score</div>
        <div className={`score-value ${scoreBump ? 'bump' : ''}`}>{obs.score}</div>
      </div>

      <div className="board-container">
        <Board
          board={obs.board}
          selectedShape={selectedShape && selectedShape.length > 0 ? selectedShape : null}
          selectedColor={selectedColor}
          onCellClick={handleCellClick}
        />

        {clearBanner && (
          <div className="clear-banner" key={clearBanner + Date.now()}>
            {clearBanner}
          </div>
        )}

        {rewardPopups.map(p => (
          <div
            key={p.id}
            className={`reward-popup ${p.value > 0 ? 'positive' : 'negative'}`}
            style={{ left: p.x, top: p.y }}
          >
            {p.value > 0 ? `+${p.value.toFixed(0)}` : p.value.toFixed(0)}
          </div>
        ))}

        {obs.game_over && (
          <div className="game-over-overlay">
            <h2>Game Over</h2>
            <div className="final-score">{obs.score}</div>
            <button className="btn btn-primary" onClick={handleReset}>Play Again</button>
          </div>
        )}
      </div>

      <BlockPicker
        blocks={obs.available_blocks}
        selectedIndex={selectedBlock}
        colorIndices={colorIndices}
        onSelect={setSelectedBlock}
      />

      <div className="info-bar">
        <span>Step: <strong>{stepCount}</strong></span>
        <span>Reward: <strong>{(obs.reward ?? 0).toFixed(1)}</strong></span>
        <button className="btn btn-small" onClick={handleReset}>New Game</button>
      </div>

      <div className="status">
        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
}

export default App;
