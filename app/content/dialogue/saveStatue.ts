import { dialogueHash } from 'app/content/dialogue/dialogueHash';


function getReviveCost(state: GameState): number {
    return Math.max(5, Math.min(50, (state.hero.savedData.money / 5) | 0 ));
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
            objectId: 'peachCaveSave',
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
            objectId: 'waterfallCaveSave',
            text: [
                {
                    dialogueIndex: 102,
                    dialogueType: 'hint',
                    text: `
                        The cave hidden behind this waterfall is a
                        convenient place to hide for Vanara and Humans who
                        wish to coexist.
                        {|}Sadly, not many are so open minded.
                        {item:secondChance}
                    `
                },
            ],
        },
        {
            objectId: 'citySave',
            text: [
                {
                    dialogueIndex: 106,
                    dialogueType: 'hint',
                    text: `
                        Pilgrims come from all across the land to worship here at
                        the Grand Temple in the Holy City.
                        {|}Although they say all are welcome, one like you won't find it easy to gain entrance.
                        {item:secondChance}
                    `
                },
            ],
        },
        {
            objectId: 'forestSave',
            text: [
                {
                    dialogueIndex: 113,
                    dialogueType: 'hint',
                    text: `
                        Humans have agreed to leave the Vanara alone as long as they keep to these woods.
                        {|}The Vanara seemed satisfied with this arrangement for many years,
                        but then one day a certain Vanara decided to go on an adventure.
                        {item:secondChance}
                    `,
                },
            ],
        },
        {
            objectId: 'tombSave',
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
            objectId: 'summonerRuinsSave',
            text: [
                {
                    dialogueIndex: 114,
                    dialogueType: 'hint',
                    text: `
                        This was once the capital of a powerful and prosperous nation.
                        {|}They say the Summoners who lived here made pacts with spirits to give them great powers.
                        {item:secondChance}
                    `,
                },
            ],
        },
        {
            objectId: 'warTempleSave',
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
            objectId: 'peaksSave',
            text: [
                {
                    dialogueIndex: 125,
                    dialogueType: 'hint',
                    text: `
                        There is a legend that long ago a mighty beast of eternal fire errupted from
                        the top of this mountain and threatened to consume the world.
                        {|}The threat was so great that in order to defeat it, the Spirit Gods
                        forged a weapon that could even kill a God.
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
            objectId: 'lakeTunnelSave',
            text: [
                {
                    dialogueIndex: 42,
                    dialogueType: 'hint',
                    text: `
                        A long time ago a star fell from the heavens scarring the land.
                        {|}This "Helix" that lies ahead is all that remains from the fallen star.
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
            objectId: 'staffTowerMiddleSave',
            text: [
                {
                    dialogueIndex: 159,
                    dialogueType: 'hint',
                    text: `
                        I've heard there is a relic somewhere in this world that can protect the wearer from lightning.
                        {item:secondChance}
                    `,
                },
            ],
        },
        {
            objectId: 'staffTowerBossSave',
            text: [
                {
                    dialogueIndex: 160,
                    dialogueType: 'hint',
                    text: `
                        Use your Spirit Abilities to reach the ladder.
                        {item:secondChance}
                    `,
                },
            ],
        },
        {
            objectId: 'warPalaceSave',
            text: [
                {
                    dialogueIndex: 167,
                    dialogueType: 'hint',
                    text: `
                        Before the Vanara arrived, the Summoner's War God was
                        the supreme ruler of both realms.
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
