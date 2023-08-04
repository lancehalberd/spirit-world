import { dialogueHash } from 'app/content/dialogue/dialogueHash';


function getReviveCost(state: GameState): number {
    return Math.max(5, Math.min(50, (state.hero.money / 5) | 0 ));
}

dialogueHash.saveStatue = {
    key: 'saveStatue',
    mappedOptions: {
        reviveChoice: (state: GameState) => {
            const cost = getReviveCost(state);
            return `Offer ${cost} Jade for a Second Chance?
                {choice: Offer ${cost} Jade?|Yes:saveStatue.attemptPurchaseRevive|No:saveStatue.no}`;
        },
        attemptPurchaseRevive: (state: GameState) => {
            return `{buy:${getReviveCost(state)}:saveStatue.purchaseRevive:saveStatue.fail`;
        },
        purchaseRevive: `Make it count. {item:secondChance}`,
        fail: 'If only you hade more Jade.',
        no: 'Then be careful out there.',
        randomizer: '{item:secondChance}',
    },
    options: [
        {
            logicCheck: {
                zones: ['peachCave'],
            },
            text: [
                {
                    dialogueIndex: 38,
                    dialogueType: 'quest',
                    text: `
                        Your life is about to get a lot more complicated.
                        {|}But no matter how hard it gets,
                        {|}remember there is someone out there rooting for you!
                        {item:secondChance}
                        Come back if you ever need another Chance.
                        {flag:peachCave:stairsUp}
                    `
                },
            ],
        },
        {
            logicCheck: {
                zones: ['tomb'],
            },
            text: [
                {
                    dialogueIndex: 39,
                    dialogueType: 'hint',
                    text: `
                        This "Tomb" is just a facade.
                        {|}The Vanara have hidden something important under
                        it where even the Spirit Gods cannot reach.
                        {item:secondChance}
                    `,
                },
            ],
        },
        {
            logicCheck: {
                zones: ['warTemple'],
            },
            text: [
                {
                    dialogueIndex: 40,
                    dialogueType: 'hint',
                    text: `
                        Long ago the God of the Summoners was the uncontested ruler of all realms.
                        {|}With the power of the "Three Calamaties" no nation could stand against the Summoners.
                        {|}But the Summoners' thirst for power would be their undoing, or so the story goes.
                        {item:secondChance}
                    `,
                },
            ],
        },
        {
            logicCheck: {
                zones: ['cocoon'],
            },
            text: [
                {
                    dialogueIndex: 41,
                    dialogueType: 'hint',
                    text: `
                        Hundreds of Vanara sleep in this Cocoon waiting for their time to walk these
                        lands.
                        {|}The Vanara village is far too small for them all.
                        {item:secondChance}
                    `,
                },
            ],
        },
        {
            logicCheck: {
                zones: ['helix'],
            },
            text: [
                {
                    dialogueIndex: 42,
                    dialogueType: 'hint',
                    text: `
                        A long time ago a star fell from the heavens and changed this land.
                        {|}The crater it left filled with water and became a lake.
                        {|}This "Helix" is all that remains from the fallen star.
                        {item:secondChance}
                    `
                },
            ],
        },
        {
            logicCheck: {
                zones: ['waterfallTower'],
            },
            text: [
                {
                    dialogueIndex: 43,
                    dialogueType: 'hint',
                    text: `
                        There is a hidden staircase behind one of the bead flows.
                        {|}Find a way to wade through the beads without being swept away!
                        {item:secondChance}
                    `,
                },
            ],
        },
        {
            logicCheck: {
                zones: ['tree'],
            },
            text: [
                {
                    dialogueIndex: 44,
                    dialogueType: 'hint',
                    text: `
                        The final battle is ahead.
                        {|}It isn't finished yet, but hopefully it will still be a fun challenge.
                        {item:secondChance}
                    `,
                },
            ],
        },
        // This is the default text and probably won't be used in the long run.
        {
            logicCheck: {
            },
            text: [
                {
                    dialogueIndex: 45,
                    text: `
                        Be careful ahead.
                        {item:secondChance}
                    `,
                },
            ],
        },
    ],
};
