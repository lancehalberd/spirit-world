import {pushScene, sceneHash} from 'app/scenes/sceneHash';
import {removeEffectFromArea} from 'app/utils/effects';

export function showDefeatedScene(state: GameState) {
    state.hero.life = 0;
    state.hero.invulnerableFrames = 0;
    state.hero.action = null;
    state.hero.chargeTime = 0;
    state.hero.frozenDuration = 0;
    state.hero.endInvisibility(state);
    if (state.hero.heldChakram) {
        removeEffectFromArea(state, state.hero.heldChakram);
        delete state.hero.heldChakram;
    }
    if (state.hero.savedData.hasRevive) {
        state.reviveTime = state.fieldTime;
    }
    pushScene(state, sceneHash.defeated);
    sceneHash.defeated.time = 0;
    sceneHash.defeated.reviving = false;
}

export function showDefeatedMenuScene(state: GameState) {
    pushScene(state, sceneHash.defeatedMenu);
    sceneHash.defeatedMenu.cursorIndex = 0;
}

export function getActiveDefeatedScene(state: GameState) {
    if (state.sceneStack.includes(sceneHash.defeated)) {
        return sceneHash.defeated;
    }
}
