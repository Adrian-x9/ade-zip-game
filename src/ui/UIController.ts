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
    if (this.scoreElement) {
      this.scoreElement.textContent = state.score.toString();
    }
    
    const boardElement = document.getElementById('game-board');
    if (!boardElement) return;
    
    boardElement.innerHTML = '';
    
    const cols = Math.sqrt(state.puzzle.length);
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    if (state.status === 'WIN') {
      boardElement.classList.add('win');
    } else {
      boardElement.classList.remove('win');
    }

    // RYSOWANIE WĘŻYKA SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'path-svg');
    svg.setAttribute('viewBox', `0 0 ${cols * 100} ${cols * 100}`); 

    if (state.path.length > 0) {
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
    boardElement.appendChild(svg);

    // RENDEROWANIE KAFELKÓW
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
        if (pathIndex === state.path.length - 1) cell.classList.add('current');
      }
      
      boardElement.appendChild(cell);
    });

    // LOGIKA PRZYCISKÓW (Właściwa lokalizacja)
    const startBtn = document.getElementById('btn-start') as HTMLButtonElement;
    const resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;
    
    if (startBtn) {
      if (state.status === 'WIN') {
        startBtn.textContent = 'Next Level';
        startBtn.disabled = false;
      } else {
        startBtn.textContent = state.status === 'PLAYING' ? `Level ${state.level}` : 'Start';
        startBtn.disabled = state.status === 'PLAYING';
      }
    }
    if (resetBtn) resetBtn.disabled = state.status !== 'PLAYING';
  }
}