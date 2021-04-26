import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.vanaraVillager = {
    key: 'vanaraVillager',
    options: [
        {
            logicCheck: {
                requiredFlags: ['$bow'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                `Is it true the Elder let you keep his family heirloom?`,
                `I tried using the Spirit Bow once but nothing happened!`,
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `The Vanara Elder?
                {|}He lives in the tree to the Southwest.`,
                `We aren't supposed to talk to you.`,
                `Is it true there are Vanara living with Humans?`,
            ],
            repeatIndex: 0,
        },
    ],
};
