import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { saveGame } from 'app/utils/saveGame';

import { GameState } from 'app/types';

dialogueHash.rival = {
    key: 'rival',
    mappedOptions: {
        startFirstFight: (state: GameState) => {
            // If the hero escapes without entering the tomb or defeating the rival, the
            // rival will show this text on returning.
            if (state.savedState.objectFlags.tombRivalFightStarted) {
                return `Don't make me thump you again!`;
            }
            state.savedState.objectFlags.tombRivalFightStarted = true;
            saveGame(state);
            // This is the typical text as the bow is the easiest way to start the fight.
            if (state.hero.activeTools.bow) {
                return `Is that the Elder's Spirit Bow?{|}I can't let you leave with that!`;
            }
            return `Now you've done it!{|}Maybe a beating will knock some sense into you!`;
        },
        tombOpened: `Don't make me get the Elder!`,
        lostFirstFight: `That's enough, I'm telling the Elder about this!`,
    },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
                zones: ['overworld'],
            },
            isExclusive: true,
            text: [
                `I'm in no mood for your tricks today!
                `,
                `You're not getting me in trouble today!
                `,
                `You know you're not allowed in here.
                `,
            ],
        },
    ],
};
