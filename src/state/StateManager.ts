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
      status: 'IDLE'
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
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage is not available:', e);
    }
  }

  private loadState(): GameState {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return { ...this.getDefaultState(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse save data:', e);
    }
    return this.getDefaultState();
  }
  
  public resetCurrentGame(): void {
    this.updateState({ score: 0, status: 'IDLE' });
  }
}