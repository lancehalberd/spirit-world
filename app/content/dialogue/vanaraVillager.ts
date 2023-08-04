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
                    {|}He lives in the tree to the Southwest.`,
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
        peachReward: `{item:peachOfImmortalityPiece}{flag:vanaraStoragePeachPiece}`,
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
                    dialogueType: 'quest',
                    text: `Wait you got rid of all those bugs in the basement?
                    {|}When did you get so helpful?
                    {|}Nevermind, go ahead and take this, I found it in
                    one of the storage chests, it seemed to be attracting those things.
                    {@storageVanara.peachReward}`,
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
                    {|}His house is the one next to this one.`,
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
