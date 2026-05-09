import { GameState } from '../types';

export class UIController {
  private appContainer: HTMLElement;
  private scoreElement: HTMLElement | null = null;
  public onAction: ((actionId: string) => void) | null = null;

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
      </footer>
    `;

    this.scoreElement = document.getElementById('score-val');
    this.bindEvents();
  }

  private bindEvents(): void {
    const startBtn = document.getElementById('btn-start');
    startBtn?.addEventListener('click', () => {
      if (this.onAction) this.onAction('START_GAME');
    });

    const board = document.getElementById('game-board');
    board?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('.grid-cell') && this.onAction) {
        this.onAction(`CELL_CLICK:${target.dataset.id}`);
      }
    });
  }

  public render(state: Readonly<GameState>): void {
    if (this.scoreElement) {
      this.scoreElement.textContent = state.score.toString();
    }
    
    const boardElement = document.getElementById('game-board');
    if (boardElement) {
      boardElement.innerHTML = '';
      
      // Dodajemy klasę CSS dla efektu wygranej
      if (state.status === 'WIN') {
        boardElement.classList.add('win');
      } else {
        boardElement.classList.remove('win');
      }
      
      state.puzzle.forEach((cellValue, index) => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.id = index.toString();
        
        // 1. Renderowanie punktów kontrolnych (liczb)
        if (cellValue > 0) {
          cell.textContent = cellValue.toString();
          cell.classList.add('checkpoint');
        }
        
        // 2. Renderowanie ścieżki
        const pathIndex = state.path.indexOf(index);
        if (pathIndex !== -1) {
          cell.classList.add('active'); // Odwiedzone
          
          // Podświetlenie aktualnej pozycji (głowa węża)
          if (pathIndex === state.path.length - 1) {
            cell.classList.add('current');
          }
        }
        
        boardElement.appendChild(cell);
      });
    }

    const startBtn = document.getElementById('btn-start') as HTMLButtonElement;
    if (startBtn) {
      if (state.status === 'WIN') {
        startBtn.textContent = 'Play Again';
        startBtn.disabled = false;
      } else {
        startBtn.textContent = 'Start';
        startBtn.disabled = state.status === 'PLAYING';
      }
    }
  }
}