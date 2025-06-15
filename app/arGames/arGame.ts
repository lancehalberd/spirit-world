import {dodgerGame} from 'app/arGames/dodger/dodger';
import {hotaGame} from 'app/arGames/hota/hota';
//import {targetPracticeGame} from 'app/arGames/target_practice/target_practice_game';
import {targetPracticeGame} from 'app/arGames/target_practice/target_practice_game_no_bullet';

export function getARScene(state: GameState): ARGame {
    if (state.arState.scene === 'dodger') {
        //return dodgerGame;
        return targetPracticeGame;
    }
    if (state.arState.scene === 'hota') {
        return hotaGame;
    }
    if (state.arState.scene === 'target') {
        return targetPracticeGame;
    }
}

export function startARGame(state: GameState, game: ARGameID) {
    state.arState.scene = game;
    getARScene(state).start(state);
}

export function updateAR(state: GameState) {
    if (!state.arState.active) {
        return;
    }
    getARScene(state).update(state);
}

export function renderAR(context: CanvasRenderingContext2D, state: GameState) {
    if (!state.arState.active) {
        return;
    }
    getARScene(state).render(context, state);
}

export function renderARHUD(context: CanvasRenderingContext2D, state: GameState) {
    if (!state.arState.active) {
        return;
    }
    getARScene(state).renderHUD(context, state);
}
