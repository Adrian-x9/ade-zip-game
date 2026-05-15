export type GameStatus = 'IDLE' | 'PLAYING' | 'GAME_OVER' | 'WIN';
export type Language = 'EN' | 'PL' | 'DE';

export interface GameState {
  score: number;
  bestScore: number;
  bestLevel: number;
  level: number;
  status: GameStatus;
  puzzle: number[];
  path: number[];
  time: number;
  totalTime: number;
  lives: number;
  savesLeft: number;
  loadsLeft: number;
  savedSnapshot: string | null;
  lang: Language;
  isDarkMode: boolean;
  controlCode: string | null;
  rivalTarget: { score: number, level: number } | null; // NOWE: Przechowuje wynik rywala
}