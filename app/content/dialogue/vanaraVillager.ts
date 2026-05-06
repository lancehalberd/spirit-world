import {dialogueHash} from 'app/content/dialogue/dialogueHash';

dialogueHash.vanaraFarmer = {
    key: 'vanaraFarmer',
    options: [
        {
            logicCheck: {
                requiredFlags: ['beastsDefeated'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 211,
                    text: `Whatever else may happen, I'm grateful for every day
                           I have tending the garden with my friends.`,
                },
                {
                    dialogueIndex: 212,
                    text: `Everyone has a role to play in this world. Enjoy yours if you can.`,
                },
                {
                    dialogueIndex: 213,
                    text: `It must be hard for humans, born into this world without knowing their purpose.`,
                },
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: ['elementalBeastsEscaped'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 237,
                    text: `First there was that earthquake and then the fog finally lifted.`,
                },
                {
                    dialogueIndex: 238,
                    text: `I'm glad the fog is gone, but will we be okay with the village exposed like this?`,
                },
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
                {
                    dialogueIndex: 239,
                    text: `I love being out in the woods, but I get uncomfortable if I stay out in the fog too long.`,
                },
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: ['$bow'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 240,
                    text: `Please be careful with that!`,
                },
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 241,
                    text: `Here to ruin our crops again?`,
                },
            ],
            repeatIndex: 0,
        },
    ],
};

dialogueHash.vanaraVillager = {
    key: 'vanaraVillager',
    options: [
        {
            logicCheck: {
                requiredFlags: ['beastsDefeated'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 242,
                    text: `Is it true you are the one who defeated the beasts?`,
                },
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: ['elementalBeastsEscaped'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 214,
                    text: `The Elder says the Spirit Tree is still watching over us, I hope that's true!`,
                },
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
                {
                    dialogueIndex: 215,
                    text: `They say you don't mind getting wet because your mother is a human.`,
                },
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: ['$bow'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 79,
                    text: `Is it true the Elder let you keep his family heirloom?`,
                },
                {
                    dialogueIndex: 80,
                    text: `I tried using the Spirit Bow once but nothing happened!`,
                },
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 81,
                    dialogueType: 'hint',
                    text: `The Vanara Elder?
                    {|}He lives in the tree to the northwest.`,
                },
                {
                    dialogueIndex: 82,
                    text: `We aren't supposed to talk to you.`,
                },
                {
                    dialogueIndex: 83,
                    text: `Is it true there are Vanara living with Humans?`,
                },
            ],
            repeatIndex: 0,
        },
    ],
};

dialogueHash.storageVanara = {
    key: 'storageVanara',
    mappedOptions: {
        peachReward(state: GameState) {
            // Skip long dialogue in randomizer.
            if (state.randomizerState) {
                return `Thanks!{@storageVanara.peachRewardItem}`;
            }
            return `
                Wait you got rid of all those bugs in the basement?
                {|}When did you get so helpful?
                {|}Nevermind, go ahead and take this, I found it in
                one of the storage chests, it seemed to be attracting those things.
                {@storageVanara.peachRewardItem}
            `;
        },
        peachRewardItem: `{item:peachOfImmortalityPiece}{flag:vanaraStoragePeachPiece}`,
    },
    options: [
        {
            logicCheck: {
                requiredFlags: ['vanaraStoragePeachPiece'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 84,
                    text: `Let's just keep that a secret between you and me okay?`,
                },
                {
                    dialogueIndex: 85,
                    text: `Why didn't I eat it?
                    {|}What if it was poisonous or rotten!?
                    {|}Who would just eat a strange fruit that they found?`,
                },
                {
                    dialogueIndex: 86,
                    text: `It isn't much, but feel free to take what's in the other chests if you can get to them.`,
                },
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: ['treeVillageStagBeetle', 'treeVillageBeetle', 'treeVillageWingedBeetle'],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 87,
                    dialogueType: 'subquest',
                    text: `{@storageVanara.peachReward}`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 88,
                    dialogueType: 'hint',
                    text: `Are you looking for the Elder?
                    {|}He lives in the tree northwest of this one.`,
                },
                {
                    dialogueIndex: 89,
                    dialogueType: 'subquest',
                    text: `Man what am I going to do about those weird bugs in the basement?`,
                },
            ],
            repeatIndex: 0,
        },
    ],
};
