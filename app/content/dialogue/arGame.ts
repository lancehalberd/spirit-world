import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import {startARGame} from 'app/arGames/arGame';


dialogueHash.arGame = {
    key: 'arGame',
    mappedOptions: {
        start: (state: GameState) => {
            return `It's an AR device.{choice: Play AR?|Yes:arGame.chooseGame|No:arGame.no}`;
        },
        chooseGame: (state: GameState) => {
            // TODO: save available games and read them here.
            const availableGames = ['dodger'] as const;
            state.arState.active = true;
            if (availableGames.length > 1) {
                state.arState.scene = 'choose';
            } else {
                startARGame(state, availableGames[0]);
            }
            return '';
        },
        no: '',
        randomizer: '{item:secondChance}',
    },
    options: [],
};
