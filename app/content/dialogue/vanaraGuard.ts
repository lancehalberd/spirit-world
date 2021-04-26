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
                `I should throw you out for stealing from the Elder.`
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
                `Why did the elder give the Spirit Bow to a mongrel like you?`,
            ],
            notes: `The guard is still unhappy even if got permission to take the bow.`
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `This is the Vanara Village.
                {|} Outsiders aren't welcome here.`,
                `Go straight to the Elder in the Southeast tree and don't bother the villagers.`
            ],
        },
    ],
};
