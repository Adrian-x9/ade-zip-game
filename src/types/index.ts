export type GameStatus = 'IDLE' | 'PLAYING' | 'GAME_OVER';

export interface GameState {
  score: number;
  bestScore: number;
  level: number;
  status: GameStatus;
  board: number[]; // Reprezentacja planszy w jednowymiarowej tablicy
}