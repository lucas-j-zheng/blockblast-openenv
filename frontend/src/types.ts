export interface Observation {
  board: number[][];
  score: number;
  available_blocks: number[][][];
  blocks_remaining: number;
  lines_cleared: number;
  combo: number;
  game_over: boolean;
  done: boolean;
  reward: number;
}

export interface ServerMessage {
  type: 'observation' | 'error' | 'state';
  data: Observation | { message: string };
}
