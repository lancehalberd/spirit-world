import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { saveGame } from 'app/utils/saveGame';


dialogueHash.citySmith = {
    key: 'citySmith',
    mappedOptions: {
        upgrade: (state: GameState) => {
            if (state.hero.savedData.weaponUpgrades.normalRange) {
                return `{@citySmith.damage}`;
            }
            if (state.hero.savedData.weaponUpgrades.normalDamage) {
                return `{@citySmith.range}`;
            }
            if (state.hero.savedData.weapon > 1) {
                return `I can upgrade your old Chakram with the right materials.
                    {choice:Upgrade Chakram?|Range:citySmith.range|Damage:citySmith.damage|No:citySmith.no}`;
            }
            return `I can upgrade your Chakram with the right materials.
                {choice:Upgrade Chakram?|Range:citySmith.range|Damage:citySmith.damage|No:citySmith.no}`;
        },
        range: `I need 100 Jade and 2 Silver Ore to upgrade your range.
            {choice:Upgrade Range?|Yes:citySmith.craftRange|No:citySmith.no}
        `,
        damage: `I need 100 Jade and 3 Silver Ore to upgrade your damage.
            {choice:Upgrade Damage?|Yes:citySmith.craftDamage|No:citySmith.no}
        `,
        craftRange: (state: GameState) => {
            if (state.hero.savedData.silverOre < 2) {
                return `I'll need at least 2 Silver Ore to upgrade your damage.`;
            }
            if (state.hero.savedData.money < 100) {
                return `{@citySmith.fail}`;
            }
            state.hero.savedData.silverOre -= 2;
            state.hero.savedData.money -= 100;
            state.hero.savedData.weaponUpgrades.normalRange = true;
            saveGame(state);
            return `Excellent! Your Chakram is faster than ever!`;
        },
        craftDamage: (state: GameState) => {
            if (state.hero.savedData.silverOre < 3) {
                return `I'll need at least 3 Silver Ore to upgrade your damage.`;
            }
            if (state.hero.savedData.money < 100) {
                return `{@citySmith.fail}`;
            }
            state.hero.savedData.silverOre -= 3;
            state.hero.savedData.money -= 100;
            state.hero.savedData.weaponUpgrades.normalDamage = true;
            saveGame(state);
            return `Excellent! Your Chakram is more powerful than ever!`;
        },
        fail: 'This work doesn\'t come cheap, you need to bring more Jade.',
        no: 'Another time then.'
    },
    options: [
        // Once all upgrades are purchased the smith gives hints for the Forge.
        {
            logicCheck: {
                requiredFlags: ['$normalDamage', '$normalRange'],
            },
            text: [
                {
                    dialogueIndex: 46,
                    dialogueType: 'subquest',
                    text: `They tell stories of smiths in the Spirit World with skills
                    beyond those of any man.`,
                },
                {
                    dialogueIndex: 47,
                    dialogueType: 'subquest',
                    text: `Maybe there is a forge in the Spirit World that can help you.`,
                },
                {
                    dialogueIndex: 48,
                    dialogueType: 'subquest',
                    text: `Where do you suppose a mythical forge could be found?`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$weapon'],
            },
            text: [
                {
                    dialogueIndex: -1,
                    dialogueType: 'subquest',
                    text: `{@citySmith.upgrade}`
                },
            ],
        },
        {
            logicCheck: {},
            text: [
                {
                    dialogueIndex: 49,
                    text: `You have no need of my services.`
                },
            ],
        },
    ],
};

dialogueHash.forgeSmith = {
    key: 'forgeSmith',
    mappedOptions: {
        upgrade: (state: GameState) => {
            if (state.hero.savedData.weaponUpgrades.spiritRange) {
                return `{@forgeSmith.damage}`;
            }
            if (state.hero.savedData.weaponUpgrades.spiritDamage) {
                return `{@forgeSmith.range}`;
            }
            return `I can upgrade your Spirit Chakram if you can find Gold Ore.
                {choice:Upgrade Chakram?|Range:forgeSmith.range|Damage:forgeSmith.damage|No:forgeSmith.no}`;
        },
        range: `I need 200 Jade, 1 Gold Ore and 2 Silver Ore to upgrade your range.
            {choice:Upgrade Range?|Yes:forgeSmith.craftRange|No:forgeSmith.no}
        `,
        damage: `I need 200 Jade, 1 Gold Ore and 3 Silver Ore to upgrade your damage
            {choice:Upgrade Damage?|Yes:forgeSmith.craftDamage|No:forgeSmith.no}
        `,
        craftRange: (state: GameState) => {
            if (state.hero.savedData.goldOre < 1) {
                return `I'll need some Gold Ore to upgrade your range.`;
            }
            if (state.hero.savedData.silverOre < 2) {
                return `I'll need at least 2 Silver Ore to upgrade your damage.`;
            }
            if (state.hero.savedData.money < 200) {
                return `{@forgeSmith.fail}`;
            }
            state.hero.savedData.goldOre -= 1;
            state.hero.savedData.silverOre -= 2;
            state.hero.savedData.money -= 200;
            state.hero.savedData.weaponUpgrades.spiritRange = true;
            saveGame(state);
            return `Excellent! Your Chakram is faster than ever!`;
        },
        craftDamage: (state: GameState) => {
            if (state.hero.savedData.goldOre < 1) {
                return `I'll need some Gold Ore to upgrade your range.`;
            }
            if (state.hero.savedData.silverOre < 3) {
                return `I'll need at least 3 Silver Ore to upgrade your damage.`;
            }
            if (state.hero.savedData.money < 200) {
                return `{@forgeSmith.fail}`;
            }
            state.hero.savedData.goldOre -= 1;
            state.hero.savedData.silverOre -= 3;
            state.hero.savedData.money -= 200;
            state.hero.savedData.weaponUpgrades.spiritDamage = true;
            saveGame(state);
            return `Excellent! Your Chakram is more powerful than ever!`;
        },
        fail: 'You still need Jade even in the Spirit World.',
        no: 'Another time then.'
    },
    options: [
        // Once all upgrades are purchased the smith gives hints for the Forge.
        {
            logicCheck: {
                requiredFlags: ['$normalDamage', '$normalRange', '$spiritDamage', '$spiritRange'],
            },
            text: [
                {
                    dialogueIndex: 50,
                    text: 'Someday I will craft you a real masterpiece.',
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$spiritDamage', '$spiritRange'],
            },
            text: [
                {
                    dialogueIndex: 51,
                    dialogueType: 'subquest',
                    text: 'You\'ll need to find a more conventional smith for your other weapon.',
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$weapon:2'],
            },
            text: [
                {
                    dialogueIndex: -1,
                    dialogueType: 'subquest',
                    text: `{@forgeSmith.upgrade}`,
                }
            ],
        },
        {
            logicCheck: {},
            text: [
                {
                    dialogueIndex: 52,
                    dialogueType: 'subquest',
                    text: `I only work on the finest weapons.`,
                },
            ],
        },
    ],
};
