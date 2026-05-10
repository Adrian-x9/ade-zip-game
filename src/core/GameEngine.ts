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

    if (action === 'TOGGLE_DARK_MODE') {
      this.stateManager.updateState({ isDarkMode: !currentState.isDarkMode });
      this.uiController.render(this.stateManager.getState());
      return;
    }

    if (action === 'NEW_GAME') {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.stateManager.resetCurrentGame();
      this.startGame();
      return;
    }

    if (action === 'CHANGE_LANG') {
      const langs: ('EN' | 'PL' | 'DE')[] = ['EN', 'PL', 'DE'];
      const nextIndex = (langs.indexOf(currentState.lang) + 1) % langs.length;
      this.stateManager.updateState({ lang: langs[nextIndex] });
      this.uiController.render(this.stateManager.getState());
      return;
    }

    if (action === 'START_GAME') {
      this.startGame();
      return;
    }

    // --- TRYB DEVELOPERA: EASTER EGG (NATYCHMIASTOWE UKOŃCZENIE POZIOMU) ---
    if (action === 'DEV_NEXT_LEVEL' && currentState.status === 'PLAYING') {
      const stateUpdate = this.stateManager.getState();
      const timeBonus = Math.max(0, 100 - stateUpdate.time);

      this.stateManager.updateState({
        status: 'WIN',
        score: stateUpdate.score + 100 + (stateUpdate.level * 10) + timeBonus,
        level: stateUpdate.level + 1
      });

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.uiController.render(this.stateManager.getState());
      return;
    }

    if (action === 'DEV_RESET_BEST') {
      this.stateManager.updateState({ bestScore: 0 });
      this.uiController.render(this.stateManager.getState());
      return;
    }

    // --- ZAPIS TAKTYCZNY ---
    if (action === 'TACTICAL_SAVE' && currentState.status === 'PLAYING' && currentState.savesLeft > 0) {
      const snapshot = JSON.stringify({
        path: [...currentState.path],
        time: currentState.time,
        puzzle: [...currentState.puzzle],
        level: currentState.level   // FIX: level w snapshot
      });

      this.stateManager.updateState({
        savedSnapshot: snapshot,
        savesLeft: currentState.savesLeft - 1
      });

      this.uiController.render(this.stateManager.getState());
      return;
    }

    // --- ODCZYT TAKTYCZNY ---
    if (action === 'TACTICAL_LOAD' && currentState.status === 'PLAYING' && currentState.loadsLeft > 0 && currentState.savedSnapshot) {
      try {
        const parsed = JSON.parse(currentState.savedSnapshot);

        this.stateManager.updateState({
          path: parsed.path,
          time: parsed.time,
          puzzle: parsed.puzzle,
          level: parsed.level,      // FIX: przywracamy level ze snapshotu
          loadsLeft: currentState.loadsLeft - 1
        });

        this.uiController.render(this.stateManager.getState());
      } catch (e) {
        console.error("Tactical Load Error:", e);
      }
      return;
    }

    // --- SURVIVAL: RESET ZABIERA ŻYCIE ---
    if (action === 'RESET_PATH' && currentState.status === 'PLAYING') {
      const remainingLives = currentState.lives - 1;

      if (remainingLives <= 0) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.stateManager.updateState({ status: 'GAME_OVER', lives: 0 });
      } else {
        this.stateManager.updateState({ path: [], lives: remainingLives, time: 0 });
        this.startTimer();
      }

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
        const newTime = state.time + 1;
        this.stateManager.updateState({ time: newTime });
        this.uiController.updateTimer(newTime); // FIX: nowa wartość, nie stara
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
      time: 0,
      // FIX: Try Again resetuje życia i tokeny; savedSnapshot celowo NIE jest kasowany
      ...(isNewGame ? { lives: 3, savesLeft: 3, loadsLeft: 3 } : {})
    });

    this.uiController.render(this.stateManager.getState());
    this.startTimer();
  }

  private processMove(cellId: number): void {
    const state = this.stateManager.getState();
    const { puzzle, path } = state;

    // -1 = dziura, -2 = ściana – oba blokują ruch
    if (puzzle[cellId] === -1 || puzzle[cellId] === -2) return;

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

    if (puzzle[cellId] === maxTarget) {
      const playableCells = puzzle.filter(v => v !== -1 && v !== -2).length;
      if (path.length + 1 !== playableCells) return;
    }

    if (puzzle[cellId] > 0 && puzzle[cellId] !== maxTarget && puzzle[cellId] !== expectedNext) return;

    const newPath = [...path, cellId];
    this.stateManager.updateState({ path: newPath });

    const totalPlayable = puzzle.filter(v => v !== -1 && v !== -2).length;
    if (newPath.length === totalPlayable) {
      const stateUpdate = this.stateManager.getState();
      const timeBonus = Math.max(0, 100 - stateUpdate.time);

      this.stateManager.updateState({
        status: 'WIN',
        score: stateUpdate.score + 100 + (stateUpdate.level * 10) + timeBonus,
        level: stateUpdate.level + 1
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

  // ---------------------------------------------------------------------------
  // GENEROWANIE POZIOMU
  // ---------------------------------------------------------------------------

  private generateLevel(level: number): number[] {
    const cols = level <= 5 ? 4 : (level <= 11 ? 5 : 6);
    const total = cols * cols;
    const checkpointsCount = Math.min(3 + Math.floor(level / 2), cols === 6 ? 10 : 8);

    // HARDCORE: ściany od poziomu 18
    // Co 2 poziomy +1 ściana, max 6 na siatce 6x6
    const wallCount = level < 18 ? 0 : Math.min(Math.floor((level - 18) / 2) + 1, 6);

    let path: number[] = [];
    let walls = new Set<number>();

    // Retry: losujemy ściany i sprawdzamy czy DFS znajdzie ścieżkę Hamiltona
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = this.pickWalls(cols, wallCount);
      const candidatePath = this.generateHamiltonianPath(cols, candidate);
      if (candidatePath.length === total - candidate.size) {
        walls = candidate;
        path = candidatePath;
        break;
      }
    }

    // Fallback bez ścian
    if (path.length === 0) {
      path = this.generateHamiltonianPath(cols, new Set());
    }

    const grid = Array(total).fill(0);

    // Oznacz ściany jako -2
    for (const w of walls) {
      grid[w] = -2;
    }

    // Dziury: od poziomu 30 odcinamy krańce ścieżki
    // FIX: path.length - 1 zamiast total - 1 (błąd w oryginalnym kodzie)
    let playablePath = path;
    if (level >= 30) {
      grid[path[0]] = -1;
      grid[path[path.length - 1]] = -1;
      playablePath = path.slice(1, path.length - 1);
    }

    grid[playablePath[0]] = 1;
    grid[playablePath[playablePath.length - 1]] = checkpointsCount;

    const step = Math.floor(playablePath.length / (checkpointsCount - 1));
    for (let i = 2; i < checkpointsCount; i++) {
      grid[playablePath[(i - 1) * step]] = i;
    }

    return grid;
  }

  // Losuje N pozycji ścian z dwoma regułami:
  // 1. Nie w narożnikach (krytyczne węzły grafu)
  // 2. Nie sąsiadujące ze sobą (zmniejsza ryzyko rozspójnienia grafu)
  private pickWalls(cols: number, count: number): Set<number> {
    const total = cols * cols;
    const walls = new Set<number>();
    let tries = 0;

    while (walls.size < count && tries < 200) {
      tries++;
      const candidate = Math.floor(Math.random() * total);
      const r = Math.floor(candidate / cols);
      const c = candidate % cols;

      // Pomijamy narożniki
      if ((r === 0 || r === cols - 1) && (c === 0 || c === cols - 1)) continue;

      // Nie stawiamy dwóch ścian obok siebie
      if (this.getNeighbors(candidate, cols).some(n => walls.has(n))) continue;

      walls.add(candidate);
    }

    return walls;
  }

  // ---------------------------------------------------------------------------
  // ŚCIEŻKA HAMILTONA (obsługuje zbiór zakazanych komórek = ściany)
  // ---------------------------------------------------------------------------

  private generateHamiltonianPath(cols: number, forbidden: Set<number> = new Set()): number[] {
    const total = cols * cols;
    const playable = total - forbidden.size;
    let finalPath: number[] = [];

    const countUnvisitedNeighbors = (node: number, visited: Set<number>): number => {
      let count = 0;
      for (const n of this.getNeighbors(node, cols)) {
        if (!visited.has(n) && !forbidden.has(n)) count++;
      }
      return count;
    };

    const dfs = (curr: number, currentPath: number[], visited: Set<number>): boolean => {
      if (currentPath.length === playable) {
        finalPath = [...currentPath];
        return true;
      }

      const neighbors = this.getNeighbors(curr, cols)
        .filter(n => !visited.has(n) && !forbidden.has(n))
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

    // Losowy start z pominięciem ścian
    let startNode: number;
    let startAttempts = 0;
    do {
      startNode = Math.floor(Math.random() * total);
      startAttempts++;
    } while (forbidden.has(startNode) && startAttempts < 100);

    if (playable % 2 !== 0) {
      let parityAttempts = 0;
      while (parityAttempts < 100) {
        const r = Math.floor(startNode / cols);
        const c = startNode % cols;
        if ((r + c) % 2 === 0 && !forbidden.has(startNode)) break;
        startNode = Math.floor(Math.random() * total);
        parityAttempts++;
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