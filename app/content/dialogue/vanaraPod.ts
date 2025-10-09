import { dialogueHash } from 'app/content/dialogue/dialogueHash';


dialogueHash.vanaraPod = {
    key: 'vanaraPod',
    mappedOptions: {
    },
    options: [
        {
            logicCheck: {
                requiredFlags: ['$clone'],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 193,
                    text: `Do the Vanara in the dreaming even need bodies?`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$teleportation'],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 192,
                    text: `Are these the Vanara I met in the dreaming?`,
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
                    dialogueIndex: 190,
                    text: `No reaction at all...
                            {|}It's like they're sleeping with their eyes wide open.`,
                },
                {
                    dialogueIndex: 191,
                    text: `Will they ever wakeup?`,
                },
            ],
        },
    ],
};
