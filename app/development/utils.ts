import {enterLocation} from 'app/utils/enterLocation';

export function refreshArea(state: GameState, doNotRefreshEditor = false) {
    enterLocation(state, state.location, {doNotRefreshEditor, doNotReuseAreas: true});
}
