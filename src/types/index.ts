export type GameStatus = 'IDLE' | 'PLAYING' | 'GAME_OVER' | 'WIN';

export interface GameState {
  score: number;
  bestScore: number;
  level: number;
  status: GameStatus;
  puzzle: number[]; // Statyczny układ liczb (np. 1, 0, 0, 2...)
  path: number[];   // Tablica z indeksami odwiedzonych kafelków (ścieżka)
}