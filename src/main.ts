import './style.css';
import { StateManager } from './state/StateManager';
import { UIController } from './ui/UIController';
import { GameEngine } from './core/GameEngine';

// Nasłuchujemy beforeinstallprompt PRZED DOMContentLoaded –
// przeglądarka może go wyemitować bardzo wcześnie
let deferredInstallPrompt: any = null;
window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

document.addEventListener('DOMContentLoaded', () => {
  const stateManager = new StateManager();
  const uiController = new UIController('app');
  const game = new GameEngine(stateManager, uiController);
  game.boot();

  initInstallBanner();
});

// ---------------------------------------------------------------------------
// PWA INSTALL BANNER
// Pokazuje się jednorazowo użytkownikom którzy jeszcze nie zainstalowali apki.
// Android: przycisk "Zainstaluj" uruchamia natywny prompt Chrome.
// iOS:     wskazówka "Udostępnij → Dodaj do ekranu głównego".
// ---------------------------------------------------------------------------
function getInstallTexts(platform: 'ios' | 'android'): { msg: string; btn: string } {
  const code = (navigator.languages?.[0] || navigator.language || 'en').slice(0, 2).toLowerCase();

  const copy: Record<string, Record<'ios' | 'android', { msg: string; btn: string }>> = {
    pl: {
      ios:     { msg: 'Dodaj do ekranu głównego: kliknij ⬆️ Udostępnij → Dodaj', btn: '' },
      android: { msg: 'Zainstaluj ZIP na swoim telefonie', btn: 'Zainstaluj' }
    },
    de: {
      ios:     { msg: 'Zum Startbildschirm: ⬆️ Teilen → Zum Home-Bildschirm', btn: '' },
      android: { msg: 'ZIP auf deinem Gerät installieren', btn: 'Installieren' }
    },
    en: {
      ios:     { msg: 'Add to Home Screen: tap ⬆️ Share → Add to Home Screen', btn: '' },
      android: { msg: 'Install ZIP on your device', btn: 'Install' }
    }
  };

  return (copy[code] ?? copy.en)[platform];
}

function initInstallBanner(): void {
  // Nie pokazujemy jeśli apka już działa w trybie standalone (zainstalowana)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone) return;

  // Nie pokazujemy jeśli użytkownik już odrzucił banner
  if (localStorage.getItem('install_dismissed')) return;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  // Tworzymy element bannera i dodajemy do body (poza #app)
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.className = 'install-banner hidden';
  document.body.appendChild(banner);

  const dismiss = () => {
    banner.classList.add('hidden');
    localStorage.setItem('install_dismissed', '1');
  };

  // --- Android (Chrome): czekamy na deferredInstallPrompt ---
  if (deferredInstallPrompt) {
    showAndroidBanner(banner, deferredInstallPrompt, dismiss);
  } else if (!isIOS) {
    // Chrome może jeszcze nie wyemitować eventu – czekamy chwilę
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      showAndroidBanner(banner, e, dismiss);
    }, { once: true });
  }

  // --- iOS Safari: ręczne instrukcje ---
  if (isIOS) {
    showIOSBanner(banner, dismiss);
  }
}

function showAndroidBanner(banner: HTMLElement, promptEvent: any, dismiss: () => void): void {
  const { msg, btn } = getInstallTexts('android');
  banner.innerHTML = `
    <span class="install-banner-icon">📲</span>
    <span class="install-banner-msg">${msg}</span>
    <button class="install-banner-btn" id="install-action-btn">${btn}</button>
    <button class="install-banner-dismiss" id="install-dismiss-btn" aria-label="Zamknij">✕</button>
  `;
  banner.classList.remove('hidden');

  document.getElementById('install-action-btn')?.addEventListener('click', async () => {
    promptEvent.prompt();
    await promptEvent.userChoice;
    dismiss();
  });

  document.getElementById('install-dismiss-btn')?.addEventListener('click', dismiss);
}

function showIOSBanner(banner: HTMLElement, dismiss: () => void): void {
  const { msg } = getInstallTexts('ios');
  banner.innerHTML = `
    <span class="install-banner-icon">📲</span>
    <span class="install-banner-msg">${msg}</span>
    <button class="install-banner-dismiss" id="install-dismiss-btn" aria-label="Zamknij">✕</button>
  `;
  banner.classList.remove('hidden');

  document.getElementById('install-dismiss-btn')?.addEventListener('click', dismiss);
}

// Dodajemy definicję globalną dla bezpieczeństwa kompilacji TypeScript
declare global {
  interface Window {
    __zipInstall?: () => void;
  }
}

// Globalny punkt wejścia do wywołania instalacji na żądanie
window.__zipInstall = async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredInstallPrompt = null;
      // Ukrywamy przycisk w modalu po udanej instalacji
      const installBtn = document.getElementById('btn-modal-install');
      if (installBtn) installBtn.style.display = 'none';
    }
  } else {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const lang = (document.getElementById('btn-lang')?.textContent || '').includes('PL') ? 'PL' : 'EN';
    
    if (isIOS) {
      alert(lang === 'PL' 
        ? "Aby zainstalować na iOS: kliknij ikonę Udostępnij na dole ekranu Safari, a następnie wybierz 'Do ekranu początkowego'."
        : "To install on iOS: tap the Share icon at the bottom of Safari, then select 'Add to Home Screen'."
      );
    } else {
      alert(lang === 'PL'
        ? "Aplikacja jest już zainstalowana lub Twoja przeglądarka nie wspiera automatycznej instalacji."
        : "App is already installed or your browser does not support automatic installation."
      );
    }
  }
};