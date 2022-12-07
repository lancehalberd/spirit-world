import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.generousPriest = {
    key: 'generousPriest',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['generousPriest'],
            },
            text: [
                `This temple is open to all, even you small one.
                {|}Although it isn't much, please accept this gift.
                {flag:generousPriest} {item:money=10}`
            ],

        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `I'm sorry I cannot offer you any more.`
            ],
        },
    ],
};

dialogueHash.meanPerson = {
    key: 'meanPerson',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['meanPerson'],
            },
            text: [
                `Dance for your dinner little monkey! {flag:meanPerson} {item:money=1}`
            ],

        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `Back for more?[-] How pathetic.`,
                `Scram monkey.`
            ],
        },
    ],
};

dialogueHash.grandPriest = {
    key: 'grandPriest',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['grandPriest'],
            },
            text: [
                `You've done well to make it this far.
                 {|}To be honest many were skeptical about asking you for help.
                 {|}You may need some tougher skin yet to finish this quest.
                 {|}Thank you for your service, and take this blessing with you.
                 {flag:grandPriest} {item:ironSkin=1}`
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                'May the wisdom of the spirits guide you.'
            ],
        },
    ],
};

dialogueHash.streetVendor = {
    key: 'streetVendor',
    mappedOptions: {
        attempt1: `{buy:100:streetVendor.purchase1:streetVendor.fail`,
        purchase1: `You won't regret this. {item:peachOfImmortalityPiece} {flag:vendor1}`,
        attempt2: `{buy:150:streetVendor.purchase2:streetVendor.fail`,
        purchase2: `You're getting a great deal. {item:silverOre} {flag:vendor2}`,
        fail: 'Come back with more Jade.',
        no: 'Your loss friend.'
    },
    options: [
        {
            logicCheck: {
                requiredFlags: ['vendor1', 'elementalBeastsEscaped'],
                excludedFlags: ['vendor2'],
            },
            text: [
                `I found something rare while exploring, only 150 Jade...
                {choice:Buy for 150 Jade?|Yes:streetVendor.attempt2|No:streetVendor.no}`
            ],

        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['vendor1'],
            },
            text: [
                `I found something special while exploring, only 100 Jade...
                {choice:Buy for 100 Jade?|Yes:streetVendor.attempt1|No:streetVendor.no}`
            ],

        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `That's all I have for now friend.`
            ],
        },
    ],
};
