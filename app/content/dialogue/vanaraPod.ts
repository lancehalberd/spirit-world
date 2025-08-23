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
                    text: `No reaction at all...
                            {|}It's like their sleeping with their eyes wide open.`,
                },
                {
                    text: `Will they ever wakeup?`,
                },
            ],
        },
    ],
};
