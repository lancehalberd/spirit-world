import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { isRandomizer, randomizerGoalType } from 'app/gameConstants';
import { saveGame } from 'app/utils/saveGame';

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
            if (randomizerGoalType === 'finalBoss') {
                if (state.location.zoneKey === 'void') {
                    state.hero.winTime = state.hero.playTime;
                    saveGame(state);
                    return 'Finished!'
                }
                return `You must talk to me after defeating the final boss to finish.`;
            }
            if (randomizerGoalType === 'victoryPoints') {
                if (state.hero.victoryPoints >= state.randomizer.goal) {
                    state.hero.winTime = state.hero.playTime;
                    saveGame(state);
                    return 'Finished!'
                }
                return `You must find ${state.randomizer.goal} victory points and talk to me to finish!`;
            }
            return `Your guess is as good as mine.`;
        },
    },
    options: [
        ...(isRandomizer ? [{
            logicCheck: {},
            text: [`{@mom.randomizer}`],
        }] : []),
        {
            logicCheck: {
                zones: ['void'],
            },
            isExclusive: true,
            text: [
                `Surprised to see me here?
                {|}There isn't really a proper ending yet, so I'm here to tell you:
                {|}Congratulations, you did it! I'm so proud of everything you've accomplished.`,
                `If you want to play more, try adding ?seed=20 to the url to try random mode.`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$astralProjection'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                `May our ancestors watch over you.`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$spiritSight', 'momRuins'],
                excludedFlags: ['$astralProjection'],
            },
            text: [
                `I'm sure you can find what you need in the summoner ruins to the Southeast!`,
            ],
            repeatIndex: 0,
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
                {|}Perhaps you can find something there to help you.
                {flag:momRuins}`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['elderTomb'],
                excludedFlags: ['$spiritSight'],
            },
            text: [
                `The Vanara Elder said you should visit the Tomb to learn more about your spirit powers?
                {|}Please be careful, I hear the tomb is full of traps to keep away grave robbers.`,
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: ['$catEyes', 'momElder'],
                excludedFlags: ['elderTomb'],
            },
            text: [
                `You should head Southwest to the Vanara Village if you want to learn
                {|}more about the Vanara powers you inherited from your father.`,
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: ['$catEyes'],
                excludedFlags: ['momElder', 'elderTomb'],
            },
            text: [
                `Welcome home son!
                {|}You were gone so long I was worried you got into some kind of trouble again!
                {|}...
                {|}You ate a strange fruit in a cave and now you can see in the dark?
                {|}Your father said that the Vanara Elder had some kind of magic power but he
                said it was dangerous and they had to keep it secret.
                {|}If you have the same kind of power you should go talk to the Elder just to be safe.
                {|}The Elder lives in the Forest Village to the Southwest, just try not to bother them too much.
                {flag:momElder}`,
            ],
        },
        // The player never gets advice from their mom if they don't obtain the cat eyes.
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                'Welcome home son!',
            ],
        },
    ],
};
