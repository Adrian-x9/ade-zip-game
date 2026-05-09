export interface GameState {
  score: number;
  bestScore: number;
  level: number;
  status: GameStatus;
  puzzle: number[];
  path: number[];
  time: number; // Czas w sekundach
}