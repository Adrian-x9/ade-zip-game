import { GameState, Language } from '../types';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  EN: {
    save: "Save",
    load: "Load",
    info: "Info",
    new: "New Game",
    lives: "LIVES",
    time: "TIME",
    best: "BEST",
    start: "Start Game",
    next: "Next Level",
    try: "Try Again",
    level: "Level",
    reset: "Reset",
    dark: "Dark",
    light: "Light",
    infoTitle: "Instructions",
    inst: "Connect all available grid cells in a continuous path from 1 to the highest number, filling the entire board."
  },
  PL: {
    save: "Zapisz",
    load: "Wczytaj",
    info: "Info",
    new: "Nowa Gra",
    lives: "ŻYCIA",
    time: "CZAS",
    best: "REKORD",
    start: "Start",
    next: "Następny",
    try: "Od nowa",
    level: "Poziom",
    reset: "Reset",
    dark: "Ciemny",
    light: "Jasny",
    infoTitle: "Instrukcja",
    inst: "Połącz wszystkie kafelki w ciągłą ścieżkę od 1 do najwyższego numeru, wypełniając przy tym całą planszę."
  },
  DE: {
    save: "Speichern",
    load: "Laden",
    info: "Info",
    new: "Neues Spiel",
    lives: "LEBEN",
    time: "ZEIT",
    best: "REKORD",
    start: "Starten",
    next: "Nächstes",
    try: "Nochmal",
    level: "Level",
    reset: "Reset",
    dark: "Dunkel",
    light: "Hell",
    infoTitle: "Anleitung",
    inst: "Verbinden Sie alle verfügbaren Felder in einem durchgehenden Pfad von 1 bis zur höchsten Nummer und füllen Sie dabei das gesamte Spielfeld aus."
  }
};

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
      <div class="game-wrapper" translate="no">
        <nav class="top-nav-row">
          <button id="btn-new" class="btn-micro"></button>
          <button id="btn-lang" class="btn-micro"></button>
          <button id="btn-dark" class="btn-micro"></button>
        </nav>
        <nav class="top-nav-row">
          <button id="btn-save" class="btn-micro"></button>
          <button id="btn-info" class="btn-micro"></button>
          <button id="btn-load" class="btn-micro"></button>
        </nav>

        <header class="game-header">
          <div class="stats-group" id="lives-display-wrapper" style="cursor: pointer;">
            <div class="stat-item"><span id="lbl-lives"></span> <span id="lives-val">♥♥♥</span></div>
            <div class="stat-item"><span id="lbl-time"></span> <span id="timer-val">0 s</span></div>
          </div>
          <div class="score-display" id="score-display-wrapper">
            <div id="score-val">0</div>
            <div class="stat-item justify-right"><span id="lbl-best"></span> <span id="best-val">0</span></div>
          </div>
        </header>

        <div class="board-container">
          <div id="game-board" class="game-grid"></div>
          <svg id="path-overlay" class="path-svg"></svg>
        </div>

        <footer class="game-controls">
          <button id="btn-start" class="btn-primary"></button>
          <button id="btn-reset" class="btn-outline" disabled></button>
        </footer>

        <div id="info-modal" class="modal-overlay hidden">
          <div class="modal-content">
            <h3 id="info-title"></h3>
            <p id="info-inst"></p>
            <hr class="modal-hr" />
            <div class="author-info">
              ade ZIP game by Adrian Ulbrych<br/>
              v1.0 &copy; 2026-05-10
            </div>
            <button id="btn-close-info" class="btn-close">OK</button>
          </div>
        </div>
      </div>
    `;

    this.scoreElement = document.getElementById('score-val');
    this.bindEvents();
  }

  public updateTimer(time: number): void {
    const timerEl = document.getElementById('timer-val');
    if (timerEl) timerEl.textContent = `${time} s`;
  }

  private bindEvents(): void {
    const trigger = (id: string, action: string) => {
      document.getElementById(id)?.addEventListener('click', () => {
        if (this.onAction) this.onAction(action);
      });
    };

    trigger('btn-start', 'START_GAME');
    trigger('btn-reset', 'RESET_PATH');
    trigger('btn-save', 'TACTICAL_SAVE');
    trigger('btn-load', 'TACTICAL_LOAD');
    trigger('btn-new', 'NEW_GAME');
    trigger('btn-lang', 'CHANGE_LANG');

    document.getElementById('btn-dark')?.addEventListener('click', () => {
      if (this.onAction) this.onAction('TOGGLE_DARK_MODE');
    });

    document.getElementById('btn-info')?.addEventListener('click', () => {
      document.getElementById('info-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-info')?.addEventListener('click', () => {
      document.getElementById('info-modal')?.classList.add('hidden');
    });

    // EASTER EGG 1: SCORE DOUBLE CLICK (DEV WIN)
    let scoreTapCount = 0;
    let scoreTapTimer: any = null;
    document.getElementById('score-display-wrapper')?.addEventListener('click', () => {
      scoreTapCount++;
      if (scoreTapCount === 2) {
        scoreTapCount = 0;
        clearTimeout(scoreTapTimer);
        if (this.onAction) this.onAction('DEV_NEXT_LEVEL');
      } else {
        clearTimeout(scoreTapTimer);
        scoreTapTimer = setTimeout(() => { scoreTapCount = 0; }, 400);
      }
    });

    // EASTER EGG 2: LIVES DOUBLE CLICK (RESET BEST SCORE)
    let livesTapCount = 0;
    let livesTapTimer: any = null;
    document.getElementById('lives-display-wrapper')?.addEventListener('click', () => {
      livesTapCount++;
      if (livesTapCount === 2) {
        livesTapCount = 0;
        clearTimeout(livesTapTimer);
        if (this.onAction) this.onAction('DEV_RESET_BEST');
      } else {
        clearTimeout(livesTapTimer);
        livesTapTimer = setTimeout(() => { livesTapCount = 0; }, 400);
      }
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
    const t = TRANSLATIONS[state.lang];

    if (state.isDarkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');

    const darkBtn = document.getElementById('btn-dark');
    if (darkBtn) darkBtn.textContent = state.isDarkMode ? `☀️ ${t.light}` : `🌙 ${t.dark}`;

    const setTxt = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setTxt('lbl-lives', t.lives);
    setTxt('lbl-time', t.time);
    setTxt('lbl-best', t.best);
    setTxt('btn-new', t.new);
    setTxt('btn-info', t.info);
    setTxt('btn-lang', `🌐 ${state.lang}`);
    setTxt('info-title', t.infoTitle);
    setTxt('info-inst', t.inst);

    if (this.scoreElement) this.scoreElement.textContent = state.score.toString();
    setTxt('best-val', state.bestScore.toString());
    setTxt('timer-val', `${state.time} s`);

    const livesEl = document.getElementById('lives-val');
    if (livesEl) livesEl.textContent = state.status === 'GAME_OVER' ? '☠️' : '♥'.repeat(state.lives);

    const saveBtn = document.getElementById('btn-save') as HTMLButtonElement;
    const loadBtn = document.getElementById('btn-load') as HTMLButtonElement;

    if (saveBtn) {
      const stars = '★'.repeat(state.savesLeft) + '☆'.repeat(3 - state.savesLeft);
      saveBtn.textContent = `${t.save} ${stars}`;
      saveBtn.disabled = state.status !== 'PLAYING' || state.savesLeft <= 0;
    }

    if (loadBtn) {
      const stars = '★'.repeat(state.loadsLeft) + '☆'.repeat(3 - state.loadsLeft);
      loadBtn.textContent = `${t.load} ${stars}`;
      loadBtn.disabled = state.status !== 'PLAYING' || !state.savedSnapshot || state.loadsLeft <= 0;
    }

    const boardElement = document.getElementById('game-board');
    if (!boardElement) return;

    const cols = Math.sqrt(state.puzzle.length);

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

    const cells = boardElement.children;
    state.puzzle.forEach((cellValue, index) => {
      const cell = cells[index] as HTMLElement;
      cell.textContent = '';
      cell.classList.remove('checkpoint', 'active', 'current', 'hole', 'wall');

      if (cellValue === -1) {
        cell.classList.add('hole');
        return;
      }
      if (cellValue === -2) {
        cell.classList.add('wall');
        return;
      }

      if (cellValue > 0) {
        cell.textContent = cellValue.toString();
        cell.classList.add('checkpoint');
      }

      const pathIndex = state.path.indexOf(index);
      if (pathIndex !== -1) {
        cell.classList.add('active');
        if (pathIndex === state.path.length - 1) cell.classList.add('current');
      }
    });

    if (state.status === 'WIN') boardElement.classList.add('win');
    else boardElement.classList.remove('win');

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

    const startBtn = document.getElementById('btn-start') as HTMLButtonElement;
    const resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;

    if (startBtn) {
      if (state.status === 'WIN') {
        startBtn.textContent = t.next;
        startBtn.disabled = false;
      } else if (state.status === 'GAME_OVER') {
        startBtn.textContent = t.try;
        startBtn.disabled = false;
      } else {
        startBtn.textContent = state.status === 'PLAYING' ? `${t.level} ${state.level}` : t.start;
        startBtn.disabled = state.status === 'PLAYING';
      }
    }
    if (resetBtn) {
      resetBtn.textContent = t.reset;
      resetBtn.disabled = state.status !== 'PLAYING';
    }
  }
}