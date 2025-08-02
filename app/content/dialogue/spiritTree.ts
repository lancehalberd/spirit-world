import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.spiritTree = {
    key: 'spiritTree',
    mappedOptions: {
        interact(state: GameState) {
            if (!state.hero.savedData.passiveTools.teleportation) {
                return '{@spiritTree.teleportation}';
            }
            return 'The Spirits of the Vanara watch over you.'
        },
        teleportation(state: GameState) {
            return '{item:teleportation}';
        },
    },
    options: [],
};
