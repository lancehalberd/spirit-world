import { query } from 'app/dom';
import { addKeyCommands } from 'app/keyCommands';
import { getState, initializeState } from 'app/state';
import { bindMouseListeners } from 'app/utils/mouse';

export function initializeGame() {
    bindMouseListeners();
    // Depends on items being defined.
    initializeState();
    addKeyCommands();
    query('.js-loading').style.display = 'none';
    query('.js-gameContent').style.display = '';
    let state = getState();
    state.gameHasBeenInitialized = true;
}
