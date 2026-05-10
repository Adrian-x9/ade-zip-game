import { GameState } from '../types';

export class StateManager {
  private readonly STORAGE_KEY = 'zip_game_save_v1';
  private state: GameState;

  constructor() {
    this.state = this.loadState();
  }

  private getDefaultState(): GameState {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return {
      score: 0,
      bestScore: 0,
      level: 1,
      status: 'IDLE',
      puzzle: [],
      path: [],
      time: 0,
      lives: 3,
      savesLeft: 3,
      loadsLeft: 3,
      savedSnapshot: null,
      lang: 'EN',
      isDarkMode: prefersDark
    };
  }

  public getState(): Readonly<GameState> {
    return this.state;
  }

  public updateState(partialState: Partial<GameState>): void {
    this.state = { ...this.state, ...partialState };

    if (this.state.score > this.state.bestScore) {
      this.state.bestScore = this.state.score;
    }

    this.saveState();
  }

  private saveState(): void {
    try {
      const saveObj = {
        bestScore: this.state.bestScore,
        lang: this.state.lang,
        isDarkMode: this.state.isDarkMode
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveObj));
    } catch (e) {
      console.warn('LocalStorage is not available:', e);
    }
  }

  private loadState(): GameState {
    const defaultState = this.getDefaultState();
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          bestScore: parsed.bestScore || 0,
          lang: parsed.lang || defaultState.lang,
          // ?? zamiast || – false to poprawna wartość, nie fallback
          isDarkMode: parsed.isDarkMode ?? defaultState.isDarkMode
        };
      }
    } catch (e) {
      console.warn('Failed to parse save data:', e);
    }
    return defaultState;
  }

  public resetCurrentGame(): void {
    this.updateState({
      score: 0,
      status: 'IDLE',
      path: [],
      lives: 3,
      savesLeft: 3,
      loadsLeft: 3,
      savedSnapshot: null
      // lang i isDarkMode pozostają bez zmian
    });
  }
}