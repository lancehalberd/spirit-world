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
                `Let's just keep that a secret between you and me okay?`,
                `Why didn't I eat it?
                {|}What if it was poisonous or rotten!?
                {|}Who would just eat a strange fruit that they found?`,
                `It isn't much, but feel free to take what's in the other chests if you can get to them.`,
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: ['treeVillageStagBeetle', 'treeVillageBeetle', 'treeVillageWingedBeetle'],
                excludedFlags: [],
            },
            text: [
                `Wait you got rid of all those bugs in the basement?
                {|}When did you get so helpful?
                {|}Nevermind, go ahead and take this, I found it in
                one of the storage chests, it seemed to be attracting those things.
                {@storageVanara.peachReward}`,
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `Are you looking for the Elder?
                {|}His house is the one next to this one.`,
                `Man what am I going to do about those weird bugs in the basement?`,
            ],
            repeatIndex: 0,
        },
    ],
};
