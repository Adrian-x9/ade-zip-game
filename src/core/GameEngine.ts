import { StateManager } from '../state/StateManager';
import { UIController } from '../ui/UIController';

export class GameEngine {
  private stateManager: StateManager;
  private uiController: UIController;

  constructor(stateManager: StateManager, uiController: UIController) {
    this.stateManager = stateManager;
    this.uiController = uiController;
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
      // KARA PUNKTOWA ZA RESET (Błąd #4)
      const penaltyScore = Math.max(0, currentState.score - 15);
      this.stateManager.updateState({ path: [], score: penaltyScore });
      this.uiController.render(this.stateManager.getState());
      return;
    }

    if (action.startsWith('CELL_CLICK:') && currentState.status === 'PLAYING') {
      const cellId = parseInt(action.split(':')[1], 10);
      this.processMove(cellId);
    }
  }

  private startGame(): void {
    const state = this.stateManager.getState();
    const isNewGame = state.status === 'IDLE' || state.status === 'GAME_OVER';
    const currentLevel = isNewGame ? 1 : state.level;
    
    // Wariant A: Zamiast tablicy wywołujemy Generator!
    const puzzle = this.generateLevel(currentLevel);
    
    this.stateManager.updateState({ 
      status: 'PLAYING', 
      path: [],
      puzzle: puzzle,
      score: isNewGame ? 0 : state.score,
      level: currentLevel
    });
    
    this.uiController.render(this.stateManager.getState());
  }

  private processMove(cellId: number): void {
    const state = this.stateManager.getState();
    const { puzzle, path } = state;

    if (path.length === 0) {
      if (puzzle[cellId] === 1) {
        this.stateManager.updateState({ path: [cellId] });
        this.uiController.render(this.stateManager.getState());
      }
      return;
    }

    if (path.includes(cellId)) return; // Backtracking obsłużymy ew. kiedy indziej

    const lastCell = path[path.length - 1];
    const cols = Math.sqrt(puzzle.length);
    if (!this.isAdjacent(lastCell, cellId, cols)) return;

    // WALIDACJA (Rozwiązanie błędu #1)
    const maxTarget = Math.max(...puzzle);
    const expectedNext = this.getNextExpectedNumber(puzzle, path);

    // Zablokowanie wejścia na cyfrę końcową, jeśli nie przeszliśmy przez CAŁĄ planszę
    if (puzzle[cellId] === maxTarget && path.length + 1 !== puzzle.length) {
      return; 
    }

    if (puzzle[cellId] > 0 && puzzle[cellId] !== maxTarget && puzzle[cellId] !== expectedNext) {
      return;
    }

    const newPath = [...path, cellId];
    this.stateManager.updateState({ path: newPath });

    if (newPath.length === puzzle.length) {
      this.stateManager.updateState({ 
        status: 'WIN',
        score: state.score + 100 + (state.level * 10), // Skalowanie nagrody
        level: state.level + 1
      });
    }

    this.uiController.render(this.stateManager.getState());
  }

  // --- Algorytmy Pomocnicze i GENERATOR POZIOMÓW ---

  private isAdjacent(index1: number, index2: number, cols: number): boolean {
    const row1 = Math.floor(index1 / cols);
    const col1 = index1 % cols;
    const row2 = Math.floor(index2 / cols);
    const col2 = index2 % cols;
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1; 
  }

  private getNextExpectedNumber(puzzle: number[], path: number[]): number {
    let currentMax = 1;
    for (const id of path) {
      if (puzzle[id] > 0) currentMax = puzzle[id];
    }
    return currentMax + 1;
  }

  // Wariant A: Proceduralne Generowanie (Błąd #2 i #7)
  private generateLevel(level: number): number[] {
    const cols = level <= 5 ? 4 : 5; // Do 5 levelu gramy 4x4, od 6 levelu gramy 5x5
    const total = cols * cols;
    // Maksymalnie 6 punktów kontrolnych dla 4x4, 8 dla 5x5
    const checkpointsCount = Math.min(3 + Math.floor(level / 2), cols === 4 ? 6 : 8); 

    const path = this.generateHamiltonianPath(cols);
    const grid = Array(total).fill(0);
    
    // 1 i Max na krańcach wygenerowanej ścieżki
    grid[path[0]] = 1; 
    grid[path[total - 1]] = checkpointsCount; 
    
    // Rozsiewanie wartości pośrednich (np. 2, 3, 4) na osi czasu ścieżki
    const step = Math.floor(total / (checkpointsCount - 1));
    for (let i = 2; i < checkpointsCount; i++) {
      grid[path[(i - 1) * step]] = i;
    }
    
    return grid;
  }

  // Klasyczny Depth-First Search z Backtrackingiem
  private generateHamiltonianPath(cols: number): number[] {
    const total = cols * cols;
    let finalPath: number[] = [];
    
    const dfs = (curr: number, currentPath: number[], visited: Set<number>): boolean => {
      if (currentPath.length === total) {
        finalPath = [...currentPath];
        return true;
      }
      
      // Mieszanie kierunków dla losowości poziomów
      const neighbors = this.getNeighbors(curr, cols).sort(() => Math.random() - 0.5);
      
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          currentPath.push(n);
          if (dfs(n, currentPath, visited)) return true;
          currentPath.pop(); // Backtrack
          visited.delete(n);
        }
      }
      return false;
    };

    const startNode = Math.floor(Math.random() * total);
    dfs(startNode, [startNode], new Set([startNode]));
    return finalPath;
  }

  private getNeighbors(index: number, cols: number): number[] {
    const r = Math.floor(index / cols);
    const c = index % cols;
    const n = [];
    if (r > 0) n.push(index - cols); // Góra
    if (r < cols - 1) n.push(index + cols); // Dół
    if (c > 0) n.push(index - 1); // Lewo
    if (c < cols - 1) n.push(index + 1); // Prawo
    return n;
  }
}