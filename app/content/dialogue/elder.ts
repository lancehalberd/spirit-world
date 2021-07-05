import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.elder = {
    key: 'elder',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$bow', 'tombEntrance'],
            },
            isExclusive: true,
            text: [
                `So you want to learn more about your Spirit powers?
                {|}Seek out the Guardian in the Vanara Tomb to the north.
                {|}Search my cellar for a tool you will need to enter the Tomb.
                {flag:elderTomb}`,
                `Search my cellar for a tool you will need to enter the Tomb.`,
            ],
            notes: `If this flag is set the elder will rescue you if you are defeated
                by your rival outside the tomb.`
        },
        {
            logicCheck: {
                requiredFlags: ['$bow'],
                excludedFlags: ['elderTomb', 'tombEntrance'],
            },
            isExclusive: true,
            text: [
                `I see you decided to help yourself to my family heirloom.`,
                `You can use the Spirit Bow to enter the Vanara Tomb to the north.`,
            ],
            notes: `If you take the bow without asking, he won't help you during the rival fight.`
        },
        {
            logicCheck: {
                requiredFlags: ['$bow', 'elderTomb'],
                excludedFlags: ['tombEntrance'],
            },
            isExclusive: true,
            text: [
                `You can use the Spirit Bow to enter the Vanara Tomb to the north.`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `I have done all that I can for you.`,
                `Please leave our village in peace.`
            ],
            notes: `This is fall back text.`
        }
    ],
};
