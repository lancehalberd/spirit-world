import {startDodger, updateDodger, renderDodger, renderDodgerHUD} from 'app/arGames/dodger/updateDodger';

type GameID = 'dodger';

export function getARScene(state: GameState) {
    if (state.arState.scene === 'dodger') {
        return {
            start: startDodger,
            update: updateDodger,
            render: renderDodger,
            renderHUD: renderDodgerHUD,
        };
    }
}

export function startARGame(state: GameState, game: GameID) {
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
