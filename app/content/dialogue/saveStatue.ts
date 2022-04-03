import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.saveStatue = {
    key: 'saveStatue',
    mappedOptions: {
        reviveChoice: `Offer 50 Jade for a Second Chance?
                {choice: Offer 50 Jade?|Yes:saveStatue.attemptPurchaseRevive|No:saveStatue.no}`,
        attemptPurchaseRevive: `{buy:50:saveStatue.purchaseRevive:saveStatue.fail`,
        purchaseRevive: `Make it count. {item:secondChance}`,
        fail: 'If only you hade more Jade.',
        no: 'Then be careful out there.'
    },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
                zones: ['peachCave'],
            },
            text: [
                `
                    Your life is about to get a lot more complicated.
                    {|}But no matter how hard it gets, remember
                    {|}there is someone out there rooting for you!
                    {item:secondChance}
                    Come back when you need another Chance.
                    {flag:peachCave:stairsUp}
                `
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
                zones: ['tomb'],
            },
            text: [
                `
                    This "Tomb" is just a facade.
                    {|}The Vanara have hidden something important under
                    it where even the Spirit God's cannot reach.
                    {item:secondChance}
                `
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
                zones: ['warTemple'],
            },
            text: [
                `
                    Long ago the God of the Summoners was the uncontested ruler of all realms.
                    {|}With the power of the "Three Calamaties" no nation could stand against the Summoners.
                    {|}But the Summoner's search for greater power would be their undoing, or so the story goes.
                    {item:secondChance}
                `
            ],
        },
        // This is the default text and probably won't be used in the long run.
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
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
