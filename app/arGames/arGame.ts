import {dodgerGame} from 'app/arGames/dodger/dodger';
import {hotaGame} from 'app/arGames/hota/hota';
import {waitForARGameToFinish} from 'app/scriptEvents';

export function getARGame(state: GameState): ARGame {
    if (state.arState.scene === 'dodger') {
        return dodgerGame;
    }
    if (state.arState.scene === 'hota') {
        return hotaGame;
    }
}

export function startARGame(state: GameState, game: ARGameID) {
    state.arState.scene = game;
    const arGame = getARGame(state);
    arGame.start(state);
    if (arGame.disablesPlayerMovement) {
        waitForARGameToFinish(state);
    }
}

export function updateAR(state: GameState) {
    if (!state.arState.active) {
        return;
    }
    getARGame(state).update(state);
}

export function renderAR(context: CanvasRenderingContext2D, state: GameState) {
    if (!state.arState.active) {
        return;
    }
    getARGame(state).render(context, state);
}

export function renderARHUD(context: CanvasRenderingContext2D, state: GameState) {
    if (!state.arState.active) {
        return;
    }
    getARGame(state).renderHUD(context, state);
}
