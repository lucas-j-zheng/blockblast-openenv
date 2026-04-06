"""Block Blast Environment — 8x8 grid puzzle game."""

import random
from typing import Any, Optional
from uuid import uuid4

from openenv.core.env_server.interfaces import Environment
from openenv.core.env_server.types import State

try:
    from ..models import BlockBlastAction, BlockBlastObservation
except ImportError:
    from models import BlockBlastAction, BlockBlastObservation


# ---------------------------------------------------------------------------
# Block shape definitions — each shape is a tuple of rows (tuple of 0/1).
# In Block Blast, pieces cannot be rotated, so each rotation is a separate shape.
# ---------------------------------------------------------------------------
BLOCK_SHAPES: list[tuple[tuple[int, ...], ...]] = [
    # 1x1 dot
    ((1,),),
    # Lines
    ((1, 1),),                          # 1x2
    ((1,), (1,)),                       # 2x1
    ((1, 1, 1),),                       # 1x3
    ((1,), (1,), (1,)),                 # 3x1
    ((1, 1, 1, 1),),                    # 1x4
    ((1,), (1,), (1,), (1,)),           # 4x1
    ((1, 1, 1, 1, 1),),                # 1x5
    ((1,), (1,), (1,), (1,), (1,)),    # 5x1
    # 2x2 square
    ((1, 1), (1, 1)),
    # L-shapes (4 rotations)
    ((1, 0), (1, 1)),
    ((1, 1), (1, 0)),
    ((1, 1), (0, 1)),
    ((0, 1), (1, 1)),
    # Big L-shapes (4 rotations)
    ((1, 0), (1, 0), (1, 1)),
    ((1, 1), (0, 1), (0, 1)),
    ((1, 1, 1), (1, 0, 0)),
    ((1, 0, 0), (1, 1, 1)),
    # T-shapes (4 rotations)
    ((1, 1, 1), (0, 1, 0)),
    ((0, 1, 0), (1, 1, 1)),
    ((1, 0), (1, 1), (1, 0)),
    ((0, 1), (1, 1), (0, 1)),
    # S/Z shapes
    ((0, 1, 1), (1, 1, 0)),
    ((1, 1, 0), (0, 1, 1)),
    ((1, 0), (1, 1), (0, 1)),
    ((0, 1), (1, 1), (1, 0)),
    # Rectangles
    ((1, 1, 1), (1, 1, 1)),            # 2x3
    ((1, 1), (1, 1), (1, 1)),          # 3x2
    # 3x3 square
    ((1, 1, 1), (1, 1, 1), (1, 1, 1)),
]

BOARD_SIZE = 8


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _can_place(board: list[list[int]], shape: tuple[tuple[int, ...], ...], row: int, col: int) -> bool:
    for r, shape_row in enumerate(shape):
        for c, cell in enumerate(shape_row):
            if cell == 0:
                continue
            br, bc = row + r, col + c
            if br < 0 or br >= BOARD_SIZE or bc < 0 or bc >= BOARD_SIZE:
                return False
            if board[br][bc] != 0:
                return False
    return True


def _place_block(board: list[list[int]], shape: tuple[tuple[int, ...], ...], row: int, col: int) -> int:
    """Place block on board (mutates). Returns number of cells placed."""
    cells = 0
    for r, shape_row in enumerate(shape):
        for c, cell in enumerate(shape_row):
            if cell:
                board[row + r][col + c] = 1
                cells += 1
    return cells


def _clear_lines(board: list[list[int]]) -> int:
    """Clear full rows and columns simultaneously. Returns number of lines cleared."""
    full_rows = [r for r in range(BOARD_SIZE) if all(board[r][c] for c in range(BOARD_SIZE))]
    full_cols = [c for c in range(BOARD_SIZE) if all(board[r][c] for r in range(BOARD_SIZE))]

    for r in full_rows:
        for c in range(BOARD_SIZE):
            board[r][c] = 0
    for c in full_cols:
        for r in range(BOARD_SIZE):
            board[r][c] = 0

    return len(full_rows) + len(full_cols)


def _any_block_fits(board: list[list[int]], shapes: list[tuple[tuple[int, ...], ...]]) -> bool:
    for shape in shapes:
        for r in range(BOARD_SIZE):
            for c in range(BOARD_SIZE):
                if _can_place(board, shape, r, c):
                    return True
    return False


def _shape_to_list(shape: tuple[tuple[int, ...], ...]) -> list[list[int]]:
    return [list(row) for row in shape]


# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

class BlockBlastEnvironment(Environment):
    """Block Blast puzzle game environment."""

    SUPPORTS_CONCURRENT_SESSIONS: bool = True

    def __init__(self) -> None:
        self._board: list[list[int]] = []
        self._score: int = 0
        self._current_blocks: list[tuple[tuple[int, ...], ...] | None] = []
        self._blocks_placed_in_set: int = 0
        self._game_over: bool = False
        self._rng: random.Random = random.Random()
        self._state = State(episode_id=str(uuid4()), step_count=0)

    def _generate_blocks(self) -> list[tuple[tuple[int, ...], ...] | None]:
        return [self._rng.choice(BLOCK_SHAPES) for _ in range(3)]

    def _make_observation(self, lines_cleared: int = 0, reward: float = 0.0) -> BlockBlastObservation:
        available = [
            _shape_to_list(b) if b is not None else []
            for b in self._current_blocks
        ]
        remaining = sum(1 for b in self._current_blocks if b is not None)
        return BlockBlastObservation(
            board=[row[:] for row in self._board],
            score=self._score,
            available_blocks=available,
            blocks_remaining=remaining,
            lines_cleared=lines_cleared,
            combo=lines_cleared,
            game_over=self._game_over,
            done=self._game_over,
            reward=reward,
        )

    def reset(self, seed: Optional[int] = None, episode_id: Optional[str] = None, **kwargs: Any) -> BlockBlastObservation:
        self._rng = random.Random(seed)
        self._board = [[0] * BOARD_SIZE for _ in range(BOARD_SIZE)]
        self._score = 0
        self._game_over = False
        self._blocks_placed_in_set = 0
        self._current_blocks = self._generate_blocks()
        self._state = State(
            episode_id=episode_id or str(uuid4()),
            step_count=0,
        )
        return self._make_observation()

    def step(self, action: BlockBlastAction, **kwargs: Any) -> BlockBlastObservation:  # type: ignore[override]
        if self._game_over:
            return self._make_observation()

        self._state.step_count += 1

        # Validate block_index
        if action.block_index < 0 or action.block_index > 2:
            return self._make_observation(reward=-1.0)

        shape = self._current_blocks[action.block_index]
        if shape is None:
            return self._make_observation(reward=-1.0)

        # Validate placement
        if not _can_place(self._board, shape, action.row, action.col):
            return self._make_observation(reward=-1.0)

        # Place block
        cells_placed = _place_block(self._board, shape, action.row, action.col)
        self._current_blocks[action.block_index] = None
        self._blocks_placed_in_set += 1

        # Clear lines
        lines_cleared = _clear_lines(self._board)

        # Reward components:
        #   1. Placement: 1 pt per cell
        #   2. Line clears: lines^2 * 10 (quadratic combo bonus)
        #   3. Survival bonus: +2 per step for staying alive
        #   4. Board openness: +0.1 per empty cell (incentivizes clean board)
        empty_cells = sum(1 for r in range(BOARD_SIZE) for c in range(BOARD_SIZE) if self._board[r][c] == 0)
        clear_bonus = lines_cleared * lines_cleared * 10
        step_reward = cells_placed + clear_bonus + 2.0 + (empty_cells * 0.1)

        self._score += cells_placed + clear_bonus

        # Refill blocks if all 3 placed
        if self._blocks_placed_in_set >= 3:
            self._blocks_placed_in_set = 0
            self._current_blocks = self._generate_blocks()

        # Check game over — big penalty for dying
        remaining_shapes = [b for b in self._current_blocks if b is not None]
        if not _any_block_fits(self._board, remaining_shapes):
            self._game_over = True
            step_reward -= 100

        return self._make_observation(lines_cleared=lines_cleared, reward=step_reward)

    @property
    def state(self) -> State:
        return self._state
