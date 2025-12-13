import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.vanaraGuard = {
    key: 'vanaraGuard',
    options: [
        {
            logicCheck: {
                requiredFlags: ['$bow'],
                excludedFlags: ['elderTomb'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 74,
                    text: `I should throw you out for stealing from the Elder.`,
                },
            ],
            notes: `The guard is angry if you didn't get permission to take the bow.`
        },
        {
            logicCheck: {
                requiredFlags: ['$bow', 'elderTomb'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 75,
                    text: `Why did the elder give the Spirit Bow to a mongrel like you?`,
                },
            ],
            notes: `The guard is still unhappy even if got permission to take the bow.`
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 76,
                    text: `This is the Vanara Village.
                    {|} Outsiders aren't welcome here.`,
                },
                {
                    dialogueIndex: 77,
                    text: `Head straight to the Elder and don't bother the villagers.`,
                },
                {
                    dialogueIndex: 78,
                    dialogueType: 'hint',
                    text: `The Elder lives in the Northwest tree.`,
                },
            ],
            repeatIndex: 1,
        },
    ],
};
