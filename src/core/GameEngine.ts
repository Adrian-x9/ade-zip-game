import { StateManager } from '../state/StateManager';
import { UIController } from '../ui/UIController';

export class GameEngine {
  private stateManager: StateManager;
  private uiController: UIController;
  // Predefiniowane plansze 4x4
  private readonly LEVELS = [
    [ 1, 0, 0, 0,   0, 0, 2, 0,   0, 0, 0, 0,   3, 0, 0, 4 ], // Lvl 1
    [ 0, 0, 3, 0,   0, 2, 0, 0,   1, 0, 0, 0,   0, 0, 0, 4 ], // Lvl 2
    [ 1, 0, 0, 4,   0, 0, 0, 0,   0, 2, 0, 0,   0, 0, 3, 0 ]  // Lvl 3
  ];

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

    if (action === 'RESET_PATH' && currentState.status === 'PLAYING') {
      this.stateManager.updateState({ path: [] }); // Czyści ścieżkę gracza
      this.uiController.render(this.stateManager.getState());
      return;
    }

    if (action.startsWith('CELL_CLICK:') && currentState.status === 'PLAYING') {
      const cellId = action.split(':')[1];
      this.processMove(cellId);
    }
  }

private startGame(): void {
    const state = this.stateManager.getState();
    const isNewGame = state.status === 'IDLE' || state.status === 'GAME_OVER';
    
    // Obliczanie indeksu poziomu (zapętla się, gdy braknie plansz)
    const levelIndex = isNewGame ? 0 : (state.level - 1) % this.LEVELS.length;
    
    this.stateManager.updateState({ 
      status: 'PLAYING', 
      path: [],
      puzzle: this.LEVELS[levelIndex],
      score: isNewGame ? 0 : state.score,
      level: isNewGame ? 1 : state.level
    });
    
    this.uiController.render(this.stateManager.getState());
  }

 private processMove(cellIdStr: string): void {
    const cellId = parseInt(cellIdStr, 10);
    const state = this.stateManager.getState();
    const { puzzle, path, status } = state;

    if (status !== 'PLAYING') return;

    // 1. Zaczynamy ścieżkę: wymuszamy start od jedynki
    if (path.length === 0) {
      if (puzzle[cellId] === 1) {
        this.stateManager.updateState({ path: [cellId] });
        this.uiController.render(this.stateManager.getState());
      }
      return;
    }

    // 2. Blokada przed chodzeniem po własnych śladach
    if (path.includes(cellId)) {
       // Tutaj w przyszłości dodamy mechanikę "Cofania" (Backtracking)
       return;
    }

    // 3. Walidacja sąsiedztwa (Grid 4x4 -> 4 kolumny)
    const lastCell = path[path.length - 1];
    if (!this.isAdjacent(lastCell, cellId, 4)) {
      return; // Odrzucamy ruch na ukos lub przeskakiwanie
    }

    // 4. Walidacja sekwencji: jeśli wdepnęliśmy na cyfrę, musi być właściwa
    const nextExpectedNumber = this.getNextExpectedNumber(puzzle, path);
    if (puzzle[cellId] > 0 && puzzle[cellId] !== nextExpectedNumber) {
      return; // Odrzucamy ruch (to nie jest ta cyfra, na którą czekamy)
    }

    // Aplikacja ruchu
    const newPath = [...path, cellId];
    this.stateManager.updateState({ path: newPath });

    // 5. Sprawdzenie warunku wygranej: wykorzystano wszystkie pola ORAZ trafiono w ostatnią cyfrę
    if (newPath.length === puzzle.length) {
      this.stateManager.updateState({ 
        status: 'WIN',
        score: state.score + 100, // +100 pkt za przejście
        level: state.level + 1    // Setup pod kolejny poziom
      });
      console.log('Level Completed! ZIP!');
    }

    this.uiController.render(this.stateManager.getState());
  }

  // --- Funkcje Pomocnicze ---

  private isAdjacent(index1: number, index2: number, cols: number): boolean {
    const row1 = Math.floor(index1 / cols);
    const col1 = index1 % cols;
    const row2 = Math.floor(index2 / cols);
    const col2 = index2 % cols;
    // Dystans Manhattan = 1 oznacza dokładnie jeden krok w górę, dół, lewo lub prawo
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1; 
  }

  private getNextExpectedNumber(puzzle: number[], path: number[]): number {
    let currentMax = 1;
    for (const id of path) {
      if (puzzle[id] > 0) currentMax = puzzle[id];
    }
    return currentMax + 1;
  }
}