import { GameState } from '../types';

export class UIController {
  private appContainer: HTMLElement;
  private scoreElement: HTMLElement | null = null;
  // Event Emitter w postaci prostych callbacków dla Engine'u
  public onAction: ((actionId: string) => void) | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.appContainer = container;
  }

  public init(): void {
    // Budowanie szkieletu DOM w JS (lub nasłuchiwanie na istniejący HTML z index.html)
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

    // Delegacja zdarzeń dla planszy (przykład)
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
    
    // Logika renderowania planszy w oparciu o state.status i dane z Engine'u
    if (state.status === 'GAME_OVER') {
      // Pokaż modal, wektory SVG etc.
    }
  }
}