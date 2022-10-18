import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { randomizerSeed, randomizerTotal } from 'app/gameConstants';
import { saveGame } from 'app/state';

import { GameState } from 'app/types';

dialogueHash.mom = {
    key: 'mom',
    mappedOptions: {
        rest: `{choice:Do you want to rest?|Yes:mom.yesRest|No:mom.noRest}`,
        yesRest: 'Sweet dreams! {rest}',
        noRest: 'Be careful out there!',
        randomizer:(state: GameState) => {
            if (state.hero.winTime) {
                return 'You did great!{|}Feel free to keep exploring if you like!';
            }
            if (state.hero.victoryPoints >= state.randomizer.goal) {
                state.hero.winTime = state.hero.playTime;
                saveGame();
                return 'Finished!'
            }
            return `I've hidden ${randomizerTotal} Victory Points around the world.
                {|}Find ${state.randomizer.goal} total and talk to me to win!
                {|}You have found ${state.hero.victoryPoints} so far.`;
        },
    },
    options: [
        ...(randomizerSeed ? [{
            logicCheck: {},
            text: [`{@mom.randomizer}`],
        }] : []),
        {
            logicCheck: {
                requiredFlags: ['$astralProjection'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                `May our ancestors watch over you.`,
                `{@mom.rest}`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$spiritSight'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                `So you've learned to look into the spirit world...
                {|}It is forbidden to speak of, but my ancestors gained great powers by summoning beings from the spirit world.
                {|}They say the ruins in the Southeast are where the ancient summoners lived.
                {|}Perhaps you can find something there to help you.`,
                `I'm sure you can find what you need in the summoner ruins to the Southeast!`,
                `{@mom.rest}`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `Welcome home son!
                {|}Try not to get too wet going into our cave.
                {|}Talk to me again if you want a hint.`,
                `You should head Southwest to the Vanara Village if you want to learn
                {|}more about the Vanara powers you inherited from your father.`,
                `This waterfall is a great disguise for our cave, but I wish it wasn't so cold!`,
                `{@mom.rest}`,
            ],
            repeatIndex: 0,
        },
    ],
};
