import { GameState } from '../types';

export class UIController {
  private appContainer: HTMLElement;
  private scoreElement: HTMLElement | null = null;
  public onAction: ((actionId: string) => void) | null = null;
  
  private isDragging: boolean = false;
  private currentDragCellId: string | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.appContainer = container;
  }

  public init(): void {
    this.appContainer.innerHTML = `
      <div class="game-wrapper">
        <header class="game-header">
          <div class="stats-group">
            <div class="stat-item">LEVEL <span id="level-val">1</span></div>
            <div class="stat-item">TIME <span id="timer-val">0s</span></div>
          </div>
          <div class="score-display">
            <div id="score-val">0</div>
            <small>BEST: <span id="best-val">0</span></small>
          </div>
        </header>
        
        <div class="board-container">
          <div id="game-board" class="game-grid"></div>
          <svg id="path-overlay" class="path-svg"></svg>
        </div>

        <footer class="game-controls">
          <button id="btn-start" class="btn-primary">Start Game</button>
          <button id="btn-reset" class="btn-outline" disabled>Reset</button>
        </footer>
      </div>
    `;

    this.scoreElement = document.getElementById('score-val');
    this.bindEvents();
  }

  public updateTimer(time: number): void {
    const timerEl = document.getElementById('timer-val');
    if (timerEl) timerEl.textContent = `${time}s`;
  }

  private bindEvents(): void {
    const startBtn = document.getElementById('btn-start');
    startBtn?.addEventListener('click', () => {
      if (this.onAction) this.onAction('START_GAME');
    });

    const resetBtn = document.getElementById('btn-reset');
    resetBtn?.addEventListener('click', () => {
      if (this.onAction) this.onAction('RESET_PATH');
    });

    const board = document.getElementById('game-board');
    if (!board) return;

    board.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.handlePointerMove(e);
      board.setPointerCapture(e.pointerId);
    });

    board.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      this.handlePointerMove(e);
    });

    const stopDragging = (e: PointerEvent) => {
      this.isDragging = false;
      this.currentDragCellId = null;
      board.releasePointerCapture(e.pointerId);
    };

    board.addEventListener('pointerup', stopDragging);
    board.addEventListener('pointercancel', stopDragging);
  }

  private handlePointerMove(e: PointerEvent): void {
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    
    if (target && target.matches('.grid-cell') && this.onAction) {
      const cellId = target.dataset.id;
      if (cellId && cellId !== this.currentDragCellId) {
        this.currentDragCellId = cellId;
        this.onAction(`CELL_CLICK:${cellId}`);
      }
    }
  }

  public render(state: Readonly<GameState>): void {
    if (this.scoreElement) this.scoreElement.textContent = state.score.toString();
    
    const bestEl = document.getElementById('best-val');
    if (bestEl) bestEl.textContent = state.bestScore.toString();
    
    const levelEl = document.getElementById('level-val');
    if (levelEl) levelEl.textContent = state.level.toString();

    const timerEl = document.getElementById('timer-val');
    if (timerEl) timerEl.textContent = `${state.time}s`;

    const boardElement = document.getElementById('game-board');
    if (!boardElement) return;
    
    const cols = Math.sqrt(state.puzzle.length);
    
    // 1. Budowanie fizycznych div-ów TYLKO gdy zmienia się rozmiar planszy (np. z 4x4 na 5x5)
    if (boardElement.children.length !== state.puzzle.length) {
      boardElement.innerHTML = '';
      boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      
      for (let i = 0; i < state.puzzle.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.id = i.toString();
        boardElement.appendChild(cell);
      }
    }

    // 2. AKTUALIZACJA TREŚCI I KLAS (To naprawia Twój błąd!)
    const cells = boardElement.children;
    state.puzzle.forEach((cellValue, index) => {
      const cell = cells[index] as HTMLElement;
      
      // Czyścimy wszystko co stare
      cell.textContent = '';
      cell.classList.remove('checkpoint', 'active', 'current');

      // Wpisujemy nową cyfrę, jeśli istnieje w tym miejscu w nowym levelu
      if (cellValue > 0) {
        cell.textContent = cellValue.toString();
        cell.classList.add('checkpoint');
      }
      
      // Odświeżamy stan ścieżki
      const pathIndex = state.path.indexOf(index);
      if (pathIndex !== -1) {
        cell.classList.add('active');
        if (pathIndex === state.path.length - 1) {
          cell.classList.add('current');
        }
      }
    });

    if (state.status === 'WIN') {
      boardElement.classList.add('win');
    } else {
      boardElement.classList.remove('win');
    }

    // 3. Rysowanie węża (bez zmian)
    const svg = document.getElementById('path-overlay');
    if (svg) {
      svg.innerHTML = ''; 
      svg.setAttribute('viewBox', `0 0 ${cols * 100} ${cols * 100}`); 
      
      if (state.status === 'WIN') svg.classList.add('win');
      else svg.classList.remove('win');

      if (state.path.length > 0) {
        const svgNS = "http://www.w3.org/2000/svg";
        const pathLine = document.createElementNS(svgNS, 'path');
        pathLine.setAttribute('class', 'path-line');
      
        const d = state.path.map((id, index) => {
          const cx = (id % cols) * 100 + 50; 
          const cy = Math.floor(id / cols) * 100 + 50;
          return `${index === 0 ? 'M' : 'L'} ${cx} ${cy}`;
        }).join(' ');
      
        pathLine.setAttribute('d', d);
        svg.appendChild(pathLine);
      }
    }

    // Przyciski (bez zmian)
    const startBtn = document.getElementById('btn-start') as HTMLButtonElement;
    const resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;
    
    if (startBtn) {
      if (state.status === 'WIN') {
        startBtn.textContent = 'Next Level';
        startBtn.disabled = false;
      } else {
        startBtn.textContent = state.status === 'PLAYING' ? `Level ${state.level}` : 'Start Game';
        startBtn.disabled = state.status === 'PLAYING';
      }
    }
    if (resetBtn) resetBtn.disabled = state.status !== 'PLAYING';
  }
}