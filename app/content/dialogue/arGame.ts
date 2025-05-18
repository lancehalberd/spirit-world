import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import {startARGame} from 'app/arGames/arGame';


dialogueHash.arGame = {
    key: 'arGame',
    mappedOptions: {
        start: (state: GameState) => {
            return `It's an AR device.{choice: Play AR?|Yes:arGame.chooseGame|No:arGame.no}`;
        },
        quit: (state: GameState) => {
            return `{choice: Quit AR?|No:arGame.no|Yes:arGame.quitGame}`;
        },
        chooseGame: (state: GameState) => {
            // Some AR sets only allow you play specific games, so we start
            // the game immediately in this case.
            state.arState.active = true;
            state.areaInstance.needsLogicRefresh = true;
            if (state.arState.scene !== 'choose') {
                startARGame(state, state.arState.scene);
                return '';
            }
            // TODO: save available games and read them here or move this all into a "game" that just let's you choose the game to play.
            const availableGames = ['dodger'] as const;
            if (availableGames.length > 1) {
                state.arState.scene = 'choose';
            } else {
                startARGame(state, availableGames[0]);
            }
            return '';
        },
        quitGame: (state: GameState) => {
            state.arState.active = false;
            state.areaInstance.needsLogicRefresh = true;
            return '';
        },
        no: '',
        randomizer: '{item:secondChance}',
    },
    options: [],
};
