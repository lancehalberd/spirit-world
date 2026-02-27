import {MAX_FLOAT_HEIGHT} from 'app/gameConstants';
import {playAreaSound} from 'app/musicController';

// Function to set the left tool on all copies of the hero.
export function setLeftTool(state: GameState, tool: ActiveTool): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.savedData.leftTool = tool;
    }
}

// Function to set the right tool on all copies of the hero.
export function setRightTool(state: GameState, tool: ActiveTool): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.savedData.rightTool = tool;
    }
}

// Function to set the equipped boots on all copies of the hero.
export function setEquippedBoots(state: GameState, boots: Equipment): void {
    // Do nothing if these boots are already equipped.
    if (state.hero.savedData.equippedBoots === boots) {
        return;
    }
    const delta = state.hero.savedData.equippedBoots === 'cloudBoots' ? MAX_FLOAT_HEIGHT : 0;
    // Player cannot change boots unless they are "on the ground".
    // This makes it so they can't toggle boots off/on repeatedly
    // to swim over pits without surfacing.
    // You can always put on iron boots in order to start sinking when floating under water.
    if (boots !== 'ironBoots' && state.hero.z > state.hero.groundHeight + delta) {
        playAreaSound(state, state.hero.area, 'error');
        return;
    }
    // Assign the current boots to the previously equipped boots slot.
    // This is used for swapping back to cloud boots while underwater.
    state.hero.savedData.previousBoots = state.hero.savedData.equippedBoots;
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.savedData.equippedBoots = boots;
    }
}

// Function to set the equipped element on all copies of the hero.
export function setEquippedElement(state: GameState, element: MagicElement): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.setElement(element);
    }
}
