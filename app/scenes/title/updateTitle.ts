import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import {
    getTitleOptions,
} from 'app/state';

export function updateTitle(state: GameState) {
    state.hero.action = 'kneel';
    const jadeChampion = state.zone.floors[0].grid[0][0].objects[4] as NPCDefinition;
    jadeChampion.behavior = 'idle';
    console.log({jadeChampion});
    const options = getTitleOptions(state);
    const selectedOption = options[state.menuIndex];
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex - 1 + options.length) % options.length;
        playSound('menuTick');
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % options.length;
        playSound('menuTick');
    }
    if (wasConfirmKeyPressed(state)) {
        playSound('menuTick');
        console.log({selectedOption});
        switch (selectedOption) {
        case 'START':
            console.log('start playing!');
            break;
        case 'OPTIONS':
            console.log('display options');
            break;
        case 'QUIT':
            console.log('quit game');
            break;
        }
    }
}
