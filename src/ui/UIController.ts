import { GameState, Language } from '../types';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  EN: {
    save: "Save",
    load: "Load",
    info: "Info",
    new: "New Game",
    lives: "LIVES",
    time: "TIME",
    totalTime: "TOTAL TIME", // NOWE
    best: "BEST",
    maxLvl: "MAX LVL",
    start: "Start Game",
    next: "Next Level",
    try: "Try Again",
    level: "Level",
    reset: "Reset",
    dark: "Dark",
    light: "Light",
    infoTitle: "Instructions",
    inst: "Connect all available grid cells in a continuous path from 1 to the highest number, filling the entire board.",
    generating: "Building level…"
  },
  PL: {
    save: "Zapisz",
    load: "Wczytaj",
    info: "Info",
    new: "Nowa Gra",
    lives: "ŻYCIA",
    time: "CZAS",
    totalTime: "CZAS GRY", // NOWE: Zgodnie z Twoją propozycją
    best: "REKORD",
    maxLvl: "MAX LVL",
    start: "Start",
    next: "Następny",
    try: "Od nowa",
    level: "Poziom",
    reset: "Reset",
    dark: "Ciemny",
    light: "Jasny",
    infoTitle: "Instrukcja",
    inst: "Połącz wszystkie kafelki w ciągłą ścieżkę od 1 do najwyższego numeru, wypełniając przy tym całą planszę.",
    generating: "Generuję poziom…"
  },
  DE: {
    save: "Speichern",
    load: "Laden",
    info: "Info",
    new: "Neues Spiel",
    lives: "LEBEN",
    time: "ZEIT",
    totalTime: "GESAMTZEIT", // NOWE
    best: "REKORD",
    maxLvl: "MAX LVL",
    start: "Starten",
    next: "Nächstes",
    try: "Nochmal",
    level: "Level",
    reset: "Reset",
    dark: "Dunkel",
    light: "Hell",
    infoTitle: "Anleitung",
    inst: "Verbinden Sie alle verfügbaren Felder in einem durchgehenden Pfad von 1 bis zur höchsten Nummer und füllen Sie dabei das gesamte Spielfeld aus.",
    generating: "Level wird erstellt…"
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
          <div class="stats-group" id="lives-display-wrapper" style="cursor:pointer">
            <div class="stat-item"><span id="lbl-lives"></span> <span id="lives-val">♥♥♥</span></div>
            <div class="stat-item"><span id="lbl-time"></span> <span id="timer-val">0 s</span></div>
            <div class="stat-item"><span id="lbl-total-time"></span> <span id="total-timer-val">0 s</span></div>
          </div>
          <div class="score-display" id="score-display-wrapper" style="cursor:pointer">
            <div id="score-val">0</div>
            <div class="stat-item justify-right"><span id="lbl-best"></span> <span id="best-val">0</span></div>
            <div class="stat-item justify-right"><span id="lbl-max-lvl"></span> <span id="max-lvl-val">1</span></div>
          </div>
        </header>

        <div class="board-container">
          <div id="game-board" class="game-grid"></div>
          <svg id="path-overlay" class="path-svg"></svg>

          <div id="loading-overlay" class="loading-overlay hidden">
            <div class="loading-spinner"></div>
            <div id="loading-text" class="loading-text"></div>
          </div>
        </div>

        <footer class="game-controls">
          <button id="btn-start" class="btn-primary"></button>
          <button id="btn-reset" class="btn-outline" disabled></button>
        </footer>

        <div id="info-modal" class="modal-overlay hidden">
          <div class="modal-content">
            <div id="dynamic-info-wrapper"></div>
            <button id="btn-close-info" class="btn-close">OK</button>
          </div>
        </div>
      </div>
    `;

    this.scoreElement = document.getElementById('score-val');
    this.bindEvents();
  }

  // Zmodyfikowana metoda aktualizująca oba czasy jednocześnie w locie
  public updateTimer(time: number, totalTime?: number): void {
    const timerEl = document.getElementById('timer-val');
    if (timerEl) timerEl.textContent = `${time} s`;

    if (totalTime !== undefined) {
      const totalTimerEl = document.getElementById('total-timer-val');
      if (totalTimerEl) totalTimerEl.textContent = `${totalTime} s`;
    }
  }

  public showLoading(lang: Language): void {
    const t = TRANSLATIONS[lang];
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    if (text) text.textContent = t.generating;
    if (overlay) overlay.classList.remove('hidden');
  }

  private hideLoading(): void {
    document.getElementById('loading-overlay')?.classList.add('hidden');
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

    document.getElementById('info-modal')?.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('#btn-modal-install')) {
        if (typeof window !== 'undefined' && window.__zipInstall) {
          window.__zipInstall();
        }
      }
    });

    let scoreTaps = 0;
    let scoreTapTimer: ReturnType<typeof setTimeout> | null = null;
    document.getElementById('score-display-wrapper')?.addEventListener('click', () => {
      scoreTaps++;
      if (scoreTaps === 2) {
        scoreTaps = 0;
        if (scoreTapTimer) clearTimeout(scoreTapTimer);
        if (this.onAction) this.onAction('DEV_NEXT_LEVEL');
      } else {
        if (scoreTapTimer) clearTimeout(scoreTapTimer);
        scoreTapTimer = setTimeout(() => { scoreTaps = 0; }, 400);
      }
    });

    let livesTaps = 0;
    let livesTapTimer: ReturnType<typeof setTimeout> | null = null;
    document.getElementById('lives-display-wrapper')?.addEventListener('click', () => {
      livesTaps++;
      if (livesTaps === 2) {
        livesTaps = 0;
        if (livesTapTimer) clearTimeout(livesTapTimer);
        if (this.onAction) this.onAction('DEV_RESET_BEST');
      } else {
        if (livesTapTimer) clearTimeout(livesTapTimer);
        livesTapTimer = setTimeout(() => { livesTaps = 0; }, 400);
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

  private renderInfoContent(lang: string): string {
    const content = {
      PL: {
        title: "Jak grać w ZIP?",
        steps: [
          "🖱️ <b>Ruch:</b> Klikaj lub przeciągaj palcem po kafelkach, aby narysować ścieżkę.",
          "🔢 <b>Cel:</b> Musisz połączyć wszystkie kafelki, zaliczając checkpointy w kolejności.",
          "❤️ <b>Życia:</b> Masz tylko 3 serca na całą sesję. Ślepy zaułek kosztuje jedno życie.",
          "⭐ <b>Zapisy:</b> Używaj gwiazdek mądrze – masz tylko 3 szanse na zapis i odczyt stanu gry."
        ],
        btnInstall: "Zainstaluj Aplikację",
        author: "ade ZIP game by Adrian Ulbrych",
        version: "v1.2.0 © 2026-05-11"
      },
      EN: {
        title: "How to play ZIP?",
        steps: [
          "🖱️ <b>Movement:</b> Click or drag to draw your path across the grid.",
          "🔢 <b>Goal:</b> Connect all tiles by hitting checkpoints in numerical order.",
          "❤️ <b>Lives:</b> You have 3 lives per session. A dead end costs you one heart.",
          "⭐ <b>Saves:</b> Use stars wisely – only 3 save/load charges available."
        ],
        btnInstall: "Install Application",
        author: "ade ZIP game by Adrian Ulbrych",
        version: "v1.2.0 © 2026-05-11"
      },
      DE: {
        title: "Wie man ZIP spielt?",
        steps: [
          "🖱️ <b>Bewegung:</b> Klicken oder ziehen, um den Pfad zu zeichnen.",
          "🔢 <b>Ziel:</b> Verbinde alle Kacheln in der richtigen Reihenfolge.",
          "❤️ <b>Leben:</b> Du hast 3 Leben. Eine Sackgasse kostet ein Herz.",
          "⭐ <b>Speichern:</b> Nutze die Sterne weise – nur 3 Ladungen verfügbar."
        ],
        btnInstall: "App installieren",
        author: "ade ZIP game by Adrian Ulbrych",
        version: "v1.2.0 © 11.05.2026"
      }
    };

    const t = content[lang as keyof typeof content] || content.EN;
    
    // Sprawdzamy czy aplikacja działa jako zainstalowana, by ewentualnie ukryć przycisk
    const isStandalone = typeof window !== 'undefined' && 
      (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

    return `
      <div class="info-content">
        <h2>${t.title}</h2>
        <ul>
          ${t.steps.map(step => `<li>${step}</li>`).join('')}
        </ul>
        ${!isStandalone ? `
          <button id="btn-modal-install" class="btn-primary">
            📲 ${t.btnInstall}
          </button>
        ` : ''}
        <div class="author-info">
          <span class="author-name">${t.author}</span>
          <span class="author-meta">${t.version}</span>
        </div>
      </div>
    `;
  }

  public render(state: Readonly<GameState>): void {
    this.hideLoading();

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
    setTxt('lbl-total-time', t.totalTime); // Wstrzyknięcie nowej etykiety
    setTxt('lbl-best', t.best);
    setTxt('lbl-max-lvl', t.maxLvl);
    setTxt('btn-new', t.new);
    setTxt('btn-info', `ℹ️ ${t.info}`);
    setTxt('btn-lang', `🌐 ${state.lang}`);

    const dynamicInfoEl = document.getElementById('dynamic-info-wrapper');
    if (dynamicInfoEl) {
      dynamicInfoEl.innerHTML = this.renderInfoContent(state.lang);
    }

    if (this.scoreElement) this.scoreElement.textContent = state.score.toString();
    setTxt('best-val', state.bestScore.toString());
    setTxt('max-lvl-val', (state.bestLevel || 1).toString()); 
    setTxt('timer-val', `${state.time} s`);
    setTxt('total-timer-val', `${state.totalTime || 0} s`); // Wstrzyknięcie wartości całkowitego czasu

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

      if (cellValue === -1) { cell.classList.add('hole'); return; }
      if (cellValue === -2) { cell.classList.add('wall'); return; }

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
        const d = state.path.map((id, i) => {
          const cx = (id % cols) * 100 + 50;
          const cy = Math.floor(id / cols) * 100 + 50;
          return `${i === 0 ? 'M' : 'L'} ${cx} ${cy}`;
        }).join(' ');
        pathLine.setAttribute('d', d);
        svg.appendChild(pathLine);
      }
    }

    const startBtn = document.getElementById('btn-start') as HTMLButtonElement;
    const resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;

    if (startBtn) {
      if (state.status === 'WIN') { startBtn.textContent = t.next; startBtn.disabled = false; }
      else if (state.status === 'GAME_OVER') { startBtn.textContent = t.try; startBtn.disabled = false; }
      else {
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