import {MAX_FLOAT_HEIGHT} from 'app/gameConstants';
import {playSound} from 'app/utils/sounds';

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
export function setEquippedBoots(state: GameState, boots: Equipment): boolean {
    console.log('setEquippedBoots', boots);
    // Do nothing if these boots are already equipped.
    if (state.hero.savedData.equippedBoots === boots) {
        return true;
    }
    // The min delta here is 1 so that the check below does not disable changing boots while the editor is on.
    // (The editor currently forces player z to be 1).
    const delta = state.hero.savedData.equippedBoots === 'cloudBoots' ? MAX_FLOAT_HEIGHT : 1;
    // Player cannot change boots unless they are "on the ground".
    // This makes it so they can't toggle boots off/on repeatedly
    // to swim over pits without surfacing.
    // You can always put on iron boots in order to start sinking when floating under water.
    if (boots !== 'ironBoots' && state.hero.z > state.hero.groundHeight + delta) {
        playSound('error');
        return false;
    }
    // Assign the current boots to the previously equipped boots slot.
    // This is used for swapping back to cloud boots while underwater.
    state.hero.savedData.previousBoots = state.hero.savedData.equippedBoots;
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.savedData.equippedBoots = boots;
    }
    return true;
}

// Function to set the equipped element on all copies of the hero.
export function setEquippedElement(state: GameState, element: MagicElement): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.setElement(element);
    }
}
