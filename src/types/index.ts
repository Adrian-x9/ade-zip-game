export type GameStatus = 'IDLE' | 'PLAYING' | 'GAME_OVER' | 'WIN';

export interface GameState {
  score: number;
  bestScore: number;
  level: number;
  status: GameStatus;
  puzzle: number[];
  path: number[];
  time: number; // Czas w sekundach
  // --- NOWA EKONOMIA SURVIVALOWA ---
  lives: number;      // Liczba żyć (domyślnie 3)
  savesLeft: number;  // Gwiazdki zapisu (domyślnie 3)
  loadsLeft: number;  // Gwiazdki odczytu (domyślnie 3)
  savedSnapshot: string | null; // Zakodowany zrzut planszy w pamięci
}