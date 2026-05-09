import { GameState } from '../types';

export class UIController {
  private appContainer: HTMLElement;
  private scoreElement: HTMLElement | null = null;
  public onAction: ((actionId: string) => void) | null = null;
  
  // Zmienne do śledzenia przeciągania
  private isDragging: boolean = false;
  private currentDragCellId: string | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.appContainer = container;
  }

  public init(): void {
    this.appContainer.innerHTML = `
      <header class="game-header">
        <h1>ZIP</h1>
        <div class="score-board">Score: <span id="score-val">0</span></div>
      </header>
      <main id="game-board" class="game-grid"></main>
      <footer class="game-controls">
        <button id="btn-start">Start</button>
        <button id="btn-reset" disabled>Reset</button>
      </footer>
    `;

    this.scoreElement = document.getElementById('score-val');
    this.bindEvents();
  }

  private bindEvents(): void {
    // START / NEXT LEVEL
    const startBtn = document.getElementById('btn-start');
    startBtn?.addEventListener('click', () => {
      if (this.onAction) this.onAction('START_GAME');
    });

    // RESET ŚCIEŻKI
    const resetBtn = document.getElementById('btn-reset');
    resetBtn?.addEventListener('click', () => {
      if (this.onAction) this.onAction('RESET_PATH');
    });

    // DEFINICJA PLANSZY! (Brakowało jej w Twoim kodzie)
    const board = document.getElementById('game-board');
    if (!board) return;

    // Rozpoczęcie przeciągania
    board.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.handlePointerMove(e);
      board.setPointerCapture(e.pointerId);
    });

    // Ruch palcem/myszką
    board.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      this.handlePointerMove(e);
    });

    // Zakończenie przeciągania
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
    if (this.scoreElement) {
      this.scoreElement.textContent = state.score.toString();
    }
    
    const boardElement = document.getElementById('game-board');
    if (boardElement) {
      boardElement.innerHTML = '';
      
      if (state.status === 'WIN') {
        boardElement.classList.add('win');
      } else {
        boardElement.classList.remove('win');
      }
      
      state.puzzle.forEach((cellValue, index) => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.id = index.toString();
        
        if (cellValue > 0) {
          cell.textContent = cellValue.toString();
          cell.classList.add('checkpoint');
        }
        
        const pathIndex = state.path.indexOf(index);
        if (pathIndex !== -1) {
          cell.classList.add('active');
          
          if (pathIndex === state.path.length - 1) {
            cell.classList.add('current');
          }
        }
        
        boardElement.appendChild(cell);
      });
    }

    // LOGIKA PRZYCISKÓW WYCIĄGNIĘTA POZA PĘTLĘ!
    const startBtn = document.getElementById('btn-start') as HTMLButtonElement;
    const resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;
    
    if (startBtn) {
      if (state.status === 'WIN') {
        startBtn.textContent = 'Next Level';
        startBtn.disabled = false;
      } else {
        startBtn.textContent = 'Start';
        startBtn.disabled = state.status === 'PLAYING';
      }
    }

    if (resetBtn) {
      resetBtn.disabled = state.status !== 'PLAYING';
    }
  }
}