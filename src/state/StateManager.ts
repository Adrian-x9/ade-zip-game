import { GameState } from '../types';

export class StateManager {
  private readonly STORAGE_KEY = 'zip_game_save_v1';
  private state: GameState;

  constructor() {
    this.state = this.loadState();
  }

private getDefaultState(): GameState {
    return {
      score: 0,
      bestScore: 0,
      level: 1,
      status: 'IDLE',
      puzzle: [],
      path: [],
      time: 0,
      // Inicjalizacja zasobów taktycznych
      lives: 3,
      savesLeft: 3,
      loadsLeft: 3,
      savedSnapshot: null
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
      // Zapisujemy TYLKO rekord punktowy, żeby uniknąć blokady przy odświeżeniu
      const saveObj = { bestScore: this.state.bestScore };
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
        // Nadpisujemy tylko bestScore, reszta to zawsze czysty start
        return { ...defaultState, bestScore: parsed.bestScore || 0 };
      }
    } catch (e) {
      console.warn('Failed to parse save data:', e);
    }
    return defaultState;
  }
  
public resetCurrentGame(): void {
    // Twardy reset całej sesji (np. po Game Over lub kliknięciu New Game)
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