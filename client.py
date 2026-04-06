"""Block Blast Environment Client."""

from typing import Dict

from openenv.core import EnvClient
from openenv.core.client_types import StepResult
from openenv.core.env_server.types import State

from .models import BlockBlastAction, BlockBlastObservation


class BlockBlastEnv(
    EnvClient[BlockBlastAction, BlockBlastObservation, State]
):
    """
    Client for the Block Blast environment.

    Maintains a persistent WebSocket connection to the environment server.
    Each client instance has its own dedicated game session.
    """

    def _step_payload(self, action: BlockBlastAction) -> Dict:
        return {
            "block_index": action.block_index,
            "row": action.row,
            "col": action.col,
        }

    def _parse_result(self, payload: Dict) -> StepResult[BlockBlastObservation]:
        obs_data = payload.get("observation", {})
        observation = BlockBlastObservation(
            board=obs_data.get("board", []),
            score=obs_data.get("score", 0),
            available_blocks=obs_data.get("available_blocks", []),
            blocks_remaining=obs_data.get("blocks_remaining", 0),
            lines_cleared=obs_data.get("lines_cleared", 0),
            combo=obs_data.get("combo", 0),
            game_over=obs_data.get("game_over", False),
            done=payload.get("done", False),
            reward=payload.get("reward"),
            metadata=obs_data.get("metadata", {}),
        )
        return StepResult(
            observation=observation,
            reward=payload.get("reward"),
            done=payload.get("done", False),
        )

    def _parse_state(self, payload: Dict) -> State:
        return State(
            episode_id=payload.get("episode_id"),
            step_count=payload.get("step_count", 0),
        )
