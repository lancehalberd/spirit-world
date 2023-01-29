import { query } from 'app/dom';
import { addKeyboardListeners } from 'app/userInput';
import { getState, initializeState } from 'app/state';
import { addKeyboardShortcuts } from 'app/utils/addKeyboardShortcuts';
import { bindMouseListeners } from 'app/utils/mouse';

export function initializeGame() {
    bindMouseListeners();
    // Depends on items being defined.
    initializeState();
    addKeyboardListeners();
    addKeyboardShortcuts();
    query('.js-loading').style.display = 'none';
    query('.js-gameContent').style.display = '';
    let state = getState();
    state.gameHasBeenInitialized = true;
}
