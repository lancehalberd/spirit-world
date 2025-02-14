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
                {
                    dialogueIndex: 10,
                    dialogueType: 'subquest',
                    text: `This temple is open to all, even you small one.
                    {|}Although it isn't much, please accept this gift.
                    {flag:generousPriest} {item:money=10}`,
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
                    dialogueIndex: 11,
                    text: `I'm sorry I cannot offer you any more.`,
                }
            ],
        },
    ],
};

dialogueHash.gauntletPriest = {
    key: 'gauntletPriest',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['gauntletEntrance'],
            },
            text: [
                {
                    dialogueIndex: 168,
                    text: `This is the entrance to the Jade Champion's training gauntlet.`,
                },
                {
                    dialogueIndex: 169,
                    dialogueType: 'hint',
                    text: `You are free to enter if you can open the door,
                           but it will take a lot of power to activate this
                           switch.`,
                },
            ],

        },
        {
            logicCheck: {
                requiredFlags: ['gauntletEntrance'],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 170,
                    text: `Impressive!{|} Maybe if you train enough you'll be as strong as the Jade Champion someday.`,
                }
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
                {
                    dialogueIndex: 12,
                    dialogueType: 'subquest',
                    text: `Dance for your dinner little monkey! {flag:meanPerson} {item:money=1}`,
                }
            ],

        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 13,
                    text: `Back for more?[-] How pathetic.`,
                },
                {
                    dialogueIndex: 14,
                    text: `Scram monkey.`,
                },
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
                {
                    dialogueIndex: 15,
                    dialogueType: 'quest',
                    text: `You've done well to make it this far.
                     {|}To be honest many were skeptical about asking you for help.
                     {|}You may need some tougher skin yet to finish this quest.
                     {|}Thank you for your service, and take this blessing with you.
                     {flag:grandPriest} {item:ironSkin=1}`
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
                    dialogueIndex: 16,
                    text: 'May the wisdom of the spirits guide you.',
                },
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
        attempt3: `{buy:300:streetVendor.purchase3:streetVendor.fail`,
        purchase3: `Make sure to treasure it. {item:goldOre} {flag:vendor3}`,
        fail: 'Come back with more Jade.',
        no: 'Your loss friend.',
    },
    options: [
        {
            logicCheck: {
                requiredFlags: ['vendor2', 'flameBeast', 'frostBeast', 'stormBeast'],
                excludedFlags: ['vendor3'],
            },
            text: [
                {
                    dialogueIndex: -1,
                    dialogueType: 'subquest',
                    text: `I found something of great value while exploring, only 300 Jade...
                    {choice:Buy for 300 Jade?|Yes:streetVendor.attempt3|No:streetVendor.no}`,
                },
            ],

        },
        {
            logicCheck: {
                requiredFlags: ['vendor1', 'elementalBeastsEscaped'],
                excludedFlags: ['vendor2'],
            },
            text: [
                {
                    dialogueIndex: -1,
                    dialogueType: 'subquest',
                    text: `I found something rare while exploring, only 150 Jade...
                    {choice:Buy for 150 Jade?|Yes:streetVendor.attempt2|No:streetVendor.no}`,
                },
            ],

        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['vendor1'],
            },
            text: [
                {
                    dialogueIndex: -1,
                    dialogueType: 'subquest',
                    text: `I found something special while exploring, only 100 Jade...
                    {choice:Buy for 100 Jade?|Yes:streetVendor.attempt1|No:streetVendor.no}`,
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
                    dialogueIndex: 18,
                    text: `That's all I have for now friend.`,
                },
            ],
        },
    ],
};

dialogueHash.helpfulSpirit = {
    key: 'helpfulSpirit',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['helpfulSpiritGift'],
            },
            text: [
                {
                    dialogueIndex: 134,
                    dialogueType: 'subquest',
                    text: `
                    Even some beings in the Spirit World use Jade currency.
                    {|}I have no use for this but maybe it will be helpful on your quest?
                    {flag:helpfulSpiritGift} {item:money=50}`,
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
                    dialogueIndex: 135,
                    text: `I am told they are building a city for Spirits on the firmament.`,
                },
                {
                    dialogueIndex: 139,
                    text: `Even when the Sky City is finished, we will still need Spirits to monitor the Humans.`,
                },
            ],
        },
    ],
};

dialogueHash.curiousSpirit = {
    key: 'curiousSpirit',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 140,
                    text: `It is interesting observing a material being in the Spirit World.`,
                },
                {
                    dialogueIndex: 141,
                    text: `
                    Did you know Humans cannot survive in the Spirit World?
                    {|}Their lungs are not compatible with the atmosphere here.
                    `,
                },
                {
                    dialogueIndex: 142,
                    text: `
                    Humans require a special gas called oxygen to produce energy, but it does not naturally occur in the air here.
                    {|}Even though energy is abundant in the Spirit World their bodies are unable to process it.
                    {|}There is even oxygen in water but human lungs cannot process liquids.
                    `,
                },
                {
                    dialogueIndex: 143,
                    text: `
                    The Human Champion is an interesting exception.
                    She straddles both worlds, dipping in and out of them as she pleases.
                    {|}I hear you can do something similar when you peek into the other world.
                    `,
                },
            ],
            repeatIndex: 0,
        },
    ],
};
