import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.saveStatue = {
    key: 'saveStatue',
    mappedOptions: {
        reviveChoice: `Offer 50 Jade for a Second Chance?
                {choice: Offer 50 Jade?|Yes:saveStatue.attemptPurchaseRevive|No:saveStatue.no}`,
        attemptPurchaseRevive: `{buy:50:saveStatue.purchaseRevive:saveStatue.fail`,
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
                `
                    Your life is about to get a lot more complicated.
                    {|}But no matter how hard it gets,
                    {|}remember there is someone out there rooting for you!
                    {item:secondChance}
                    Come back if you ever need another Chance.
                    {flag:peachCave:stairsUp}
                `
            ],
        },
        {
            logicCheck: {
                zones: ['tomb'],
            },
            text: [
                `
                    This "Tomb" is just a facade.
                    {|}The Vanara have hidden something important under
                    it where even the Spirit Gods cannot reach.
                    {item:secondChance}
                `
            ],
        },
        {
            logicCheck: {
                zones: ['warTemple'],
            },
            text: [
                `
                    Long ago the God of the Summoners was the uncontested ruler of all realms.
                    {|}With the power of the "Three Calamaties" no nation could stand against the Summoners.
                    {|}But the Summoners' thirst for power would be their undoing, or so the story goes.
                    {item:secondChance}
                `
            ],
        },
        {
            logicCheck: {
                zones: ['cocoon'],
            },
            text: [
                `
                    Hundreds of Vanara sleep in this Cocoon waiting for their time to walk these
                    lands.
                    {|}The Vanara village is far too small for them all.
                    {item:secondChance}
                `
            ],
        },
        {
            logicCheck: {
                zones: ['helix'],
            },
            text: [
                `
                    A long time ago a star fell from the heavens and changed this land.
                    {|}The crater it left filled with water and became a lake.
                    {|}This "Helix" is all that remains from the fallen star.
                    {item:secondChance}
                `
            ],
        },
        {
            logicCheck: {
                zones: ['waterfallTower'],
            },
            text: [
                `
                    There is a hidden staircase behind one of the bead flows.
                    {|}Find a way to wade through the beads without being swept away!
                    {item:secondChance}
                `
            ],
        },
        {
            logicCheck: {
                zones: ['tree'],
            },
            text: [
                `
                    The final battle is ahead.
                    {|}It isn't finished yet, but hopefully it will still be a fun challenge.
                    {item:secondChance}
                `
            ],
        },
        // This is the default text and probably won't be used in the long run.
        {
            logicCheck: {
            },
            text: [
                `
                    Be careful ahead.
                    {item:secondChance}
                `
            ],
        },
    ],
};
