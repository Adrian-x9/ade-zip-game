import { StateManager } from '../state/StateManager';
import { UIController } from '../ui/UIController';

export class GameEngine {
  private stateManager: StateManager;
  private uiController: UIController;
  private timerInterval: number | null = null;

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
      const penaltyScore = Math.max(0, currentState.score - 15);
      this.stateManager.updateState({ path: [], score: penaltyScore, time: 0 });
      this.startTimer();
      this.uiController.render(this.stateManager.getState());
      return;
    }

    if (action.startsWith('CELL_CLICK:') && currentState.status === 'PLAYING') {
      const cellId = parseInt(action.split(':')[1], 10);
      this.processMove(cellId);
    }
  }

  private startTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const state = this.stateManager.getState();
      if (state.status === 'PLAYING') {
        this.stateManager.updateState({ time: state.time + 1 });
        this.uiController.updateTimer(state.time); 
      } else {
        if (this.timerInterval) clearInterval(this.timerInterval);
      }
    }, 1000) as unknown as number;
  }

  private startGame(): void {
    const state = this.stateManager.getState();
    const isNewGame = state.status === 'IDLE' || state.status === 'GAME_OVER';
    const currentLevel = isNewGame ? 1 : state.level;
    
    const puzzle = this.generateLevel(currentLevel);
    
    this.stateManager.updateState({ 
      status: 'PLAYING', 
      path: [],
      puzzle: puzzle,
      score: isNewGame ? 0 : state.score,
      level: currentLevel,
      time: 0 
    });
    
    this.uiController.render(this.stateManager.getState());
    this.startTimer(); 
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

    if (path.includes(cellId)) return; 

    const lastCell = path[path.length - 1];
    const cols = Math.sqrt(puzzle.length);
    if (!this.isAdjacent(lastCell, cellId, cols)) return;

    const maxTarget = Math.max(...puzzle);
    const expectedNext = this.getNextExpectedNumber(puzzle, path);

    if (puzzle[cellId] === maxTarget && path.length + 1 !== puzzle.length) return; 
    if (puzzle[cellId] > 0 && puzzle[cellId] !== maxTarget && puzzle[cellId] !== expectedNext) return;

    const newPath = [...path, cellId];
    this.stateManager.updateState({ path: newPath });

    if (newPath.length === puzzle.length) {
      const state = this.stateManager.getState();
      const timeBonus = Math.max(0, 100 - state.time); 
      const roundScore = 100 + (state.level * 10) + timeBonus;

      this.stateManager.updateState({ 
        status: 'WIN',
        score: state.score + roundScore,
        level: state.level + 1
      });
      if (this.timerInterval) clearInterval(this.timerInterval);
    }

    this.uiController.render(this.stateManager.getState());
  }

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

  private generateLevel(level: number): number[] {
    const cols = level <= 5 ? 4 : 5; 
    const total = cols * cols;
    const checkpointsCount = Math.min(3 + Math.floor(level / 2), cols === 4 ? 6 : 8); 

    const path = this.generateHamiltonianPath(cols);
    const grid = Array(total).fill(0);
    
    grid[path[0]] = 1; 
    grid[path[total - 1]] = checkpointsCount; 
    
    const step = Math.floor(total / (checkpointsCount - 1));
    for (let i = 2; i < checkpointsCount; i++) {
      grid[path[(i - 1) * step]] = i;
    }
    
    return grid;
  }

  private generateHamiltonianPath(cols: number): number[] {
    const total = cols * cols;
    let finalPath: number[] = [];
    
    // Funkcja licząca wolnych sąsiadów dla Heurystyki Warnsdorffa
    const countUnvisitedNeighbors = (node: number, visited: Set<number>): number => {
      let count = 0;
      for (const n of this.getNeighbors(node, cols)) {
        if (!visited.has(n)) count++;
      }
      return count;
    };

    const dfs = (curr: number, currentPath: number[], visited: Set<number>): boolean => {
      if (currentPath.length === total) {
        finalPath = [...currentPath];
        return true;
      }
      
      // Heurystyka Warnsdorffa - wymusza idzenie najpierw do krawędzi (zero lagów!)
      const neighbors = this.getNeighbors(curr, cols)
        .filter(n => !visited.has(n))
        .map(n => ({ id: n, weight: countUnvisitedNeighbors(n, visited) }))
        .sort((a, b) => {
          if (a.weight === b.weight) return Math.random() - 0.5;
          return a.weight - b.weight;
        });
      
      for (const neighbor of neighbors) {
        visited.add(neighbor.id);
        currentPath.push(neighbor.id);
        if (dfs(neighbor.id, currentPath, visited)) return true;
        currentPath.pop(); 
        visited.delete(neighbor.id);
      }
      return false;
    };

    let startNode = Math.floor(Math.random() * total);
    // ZABEZPIECZENIE: Na gridzie 5x5 wąż MUSI zacząć z czarnego pola szachownicy, inaczej zwiesi grę
    if (total % 2 !== 0) { 
      while (true) {
        const r = Math.floor(startNode / cols);
        const c = startNode % cols;
        if ((r + c) % 2 === 0) break; 
        startNode = Math.floor(Math.random() * total);
      }
    }

    dfs(startNode, [startNode], new Set([startNode]));
    return finalPath;
  }

  private getNeighbors(index: number, cols: number): number[] {
    const r = Math.floor(index / cols);
    const c = index % cols;
    const n = [];
    if (r > 0) n.push(index - cols); 
    if (r < cols - 1) n.push(index + cols); 
    if (c > 0) n.push(index - 1); 
    if (c < cols - 1) n.push(index + 1); 
    return n;
  }
}