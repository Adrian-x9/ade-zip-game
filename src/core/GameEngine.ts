import { StateManager } from '../state/StateManager';
import { UIController } from '../ui/UIController';

export class GameEngine {
  private stateManager: StateManager;
  private uiController: UIController;

  constructor(stateManager: StateManager, uiController: UIController) {
    this.stateManager = stateManager;
    this.uiController = uiController;

    // Połączenie zdarzeń UI z logiką gry
    this.uiController.onAction = this.handleUIAction.bind(this);
  }

  public boot(): void {
    this.uiController.init();
    this.uiController.render(this.stateManager.getState());
  }

  private handleUIAction(action: string): void {
    const currentState = this.stateManager.getState();

    if (action === 'START_GAME') {
      this.startGame();
      return;
    }

    if (action.startsWith('CELL_CLICK:') && currentState.status === 'PLAYING') {
      const cellId = action.split(':')[1];
      this.processMove(cellId);
    }
  }

  private startGame(): void {
    this.stateManager.resetCurrentGame();
    this.stateManager.updateState({ status: 'PLAYING' });
    
    // Tutaj inicjalizacja planszy, reset timerów itp.
    console.log('Game Started!');
    
    this.uiController.render(this.stateManager.getState());
  }

  private processMove(cellId: string): void {
    // Główna logika obliczeniowa gry "ZIP"
    console.log(`Processing move on: ${cellId}`);
    
    // Przykład aktualizacji stanu:
    const currentState = this.stateManager.getState();
    this.stateManager.updateState({ score: currentState.score + 10 });
    
    this.uiController.render(this.stateManager.getState());
    
    // Sprawdzanie warunków wygranej/przegranej
    // this.checkWinCondition();
  }
}