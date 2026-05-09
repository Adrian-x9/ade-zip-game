import './style.css';
import { StateManager } from './state/StateManager';
import { UIController } from './ui/UIController';
import { GameEngine } from './core/GameEngine';

document.addEventListener('DOMContentLoaded', () => {
  const stateManager = new StateManager();
  const uiController = new UIController('app'); // Zakłada <div id="app"></div> w index.html
  const game = new GameEngine(stateManager, uiController);

  game.boot();
});