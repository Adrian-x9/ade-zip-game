import { GameState } from '../types';

export class StateManager {
  // NOWY KLUCZ: Wymusza bezobsługowy reset u wszystkich dotychczasowych graczy
  private readonly STORAGE_KEY = 'zip_game_save_v1_1';
  private state: GameState;

  constructor() {
    this.state = this.loadState();
  }

  private getDefaultState(): GameState {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let defaultLang: 'EN' | 'PL' | 'DE' = 'EN';
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('pl')) defaultLang = 'PL';
      else if (browserLang.startsWith('de')) defaultLang = 'DE';
    }

    return {
      score: 0,
      bestScore: 0,
      bestLevel: 1, // Domyślny max poziom
      level: 1,
      status: 'IDLE',
      puzzle: [],
      path: [],
      time: 0,
      lives: 3,
      savesLeft: 3,
      loadsLeft: 3,
      savedSnapshot: null,
      lang: defaultLang,
      isDarkMode: prefersDark
    };
  }

  public getState(): Readonly<GameState> {
    return this.state;
  }

  public updateState(partialState: Partial<GameState>): void {
    this.state = { ...this.state, ...partialState };

    // Aktualizacja rekordów (zarówno punktów, jak i poziomu)
    if (this.state.score > this.state.bestScore) {
      this.state.bestScore = this.state.score;
    }
    if (this.state.level > this.state.bestLevel) {
      this.state.bestLevel = this.state.level;
    }

    this.saveState();
  }

  private saveState(): void {
    try {
      const saveObj = {
        bestScore: this.state.bestScore,
        bestLevel: this.state.bestLevel,
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
          bestLevel: parsed.bestLevel || 1,
          lang: parsed.lang || defaultState.lang,
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
    });
  }
}