import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.saveStatue = {
    key: 'saveStatue',
    mappedOptions: {
        introduction: `
            Your life is about to get a lot more complicated.
            {|}But no matter how hard it gets, remember
            {|}there is someone out there rooting for you!
            {item:secondChance}
            Come back when you need another Chance.
        `,
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
            },
            text: [
                `This text is not meant to be seen.`
            ],
        },
    ],
};
