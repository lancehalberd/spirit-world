import {dodgerGame} from 'app/arGames/dodger/dodger';
import {hotaGame} from 'app/arGames/hota/hota';
import {waitForARGameToFinish} from 'app/scriptEvents';
import {targetPracticeGame} from 'app/arGames/target_practice/target_practice_game';
import {fpsGame} from './target_practice/fps/fps_game';

export function getARGame(state: GameState): ARGame {
    if (state.arState.scene === 'dodger') {
        return dodgerGame;
    }
    if (state.arState.scene === 'hota') {
        return hotaGame;
    }
    if (state.arState.scene === 'target') {
        return targetPracticeGame;
    }
    if (state.arState.scene === 'targetFPS') {
        return fpsGame;
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
