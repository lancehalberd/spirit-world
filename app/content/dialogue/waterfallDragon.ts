import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.waterfallDragon = {
    key: 'waterfallDragon',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['waterfallTowerBoss'],
            },
            isExclusive: true,
            text: [
                `I have nothing to say to the likes of you.`,
                `Be gone frome my presence.`,
                `Do you feel clever?`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['waterfallTowerThroneDoor'],
            },
            isExclusive: true,
            text: [
                `You would approach me and seek a boon after ransacking my tower and destroying my machinery?
                {|}I did promise to help, but I never thought you would make it this far.
                {|}...
                {|}Very well, take this cloak and be gone from here.
                {flag:waterfallTowerThroneDoor}
                {item:cloak=2}`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `I have nothing more to say to you for now...`,
            ],
            repeatIndex: 0,
        },
    ],
};
