"""Data models for the Block Blast environment."""

from openenv.core.env_server.types import Action, Observation
from pydantic import Field


class BlockBlastAction(Action):
    """Action to place a block on the board."""

    block_index: int = Field(..., description="Which of the 3 available blocks to place (0, 1, or 2)")
    row: int = Field(..., description="Row to place the block's top-left corner (0-7)")
    col: int = Field(..., description="Column to place the block's top-left corner (0-7)")


class BlockBlastObservation(Observation):
    """Observation containing the full game state."""

    board: list[list[int]] = Field(default_factory=lambda: [[0] * 8 for _ in range(8)], description="8x8 grid, 0=empty, 1=filled")
    score: int = Field(default=0, description="Cumulative score")
    available_blocks: list[list[list[int]]] = Field(default_factory=list, description="Up to 3 block shapes as 2D grids of 0/1; empty list [] means already placed")
    blocks_remaining: int = Field(default=0, description="How many blocks left to place in current set")
    lines_cleared: int = Field(default=0, description="Lines cleared on this step")
    combo: int = Field(default=0, description="Number of simultaneous line clears this step")
    game_over: bool = Field(default=False, description="Whether the game has ended")
