import {generateWarPalaceWestRoom} from 'app/generator/content/warPalaceWestRoom';

export function generateZoneVariations(state: GameState) {
    // Reset the list of generated logic nodes each time we regenerate zone content.
    state.generatedLogicNodes = [];
    generateWarPalaceWestRoom(state);
}
