import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { isLogicValid, orLogic } from 'app/content/logic';
import { CHAKRAM_2_NAME, isRandomizer } from 'app/gameConstants';
import { saveGame } from 'app/utils/saveGame';

const canUpgradeLeatherBoots: LogicCheck = {
    // You just need the recipe.
    requiredFlags: ['$spikeBoots'],
    // The option is removed once you have obtained the flying boots.
    excludedFlags: ['$leatherBoots:2']
};

const canUpgradeCloudBoots: LogicCheck = {
    // You must have the recipe and the cloud boots.
    requiredFlags: ['$flyingBoots', '$cloudBoots:1'],
    // The option is removed once you have obtained the flying boots.
    excludedFlags: ['$cloudBoots:2']
};

const canUpgradeIronBoots: LogicCheck = {
    // You must have the recipe and the iron boots.
    requiredFlags: ['$forgeBoots', '$ironBoots:1'],
    // The option is removed once you have obtained the flying boots.
    excludedFlags: ['$ironBoots:2']
};

dialogueHash.cityArmorSmith = {
    key: 'cityArmorSmith',
    mappedOptions: {
        upgrade: (state: GameState) => {
            return `
                With these blueprints I can put some spikes on those boots so they won't slip on ice.
                {|}It will only cost you 2 Silver Ore and 100 Jade.
                {choice:Upgrade Boots?|Yes:cityArmorSmith.upgradeLeatherBoots|No:cityArmorSmith.no}
            `;
        },
        upgradeLeatherBoots: (state: GameState) => {
            if (state.hero.savedData.silverOre < 2) {
                return `I'll need at least 2 Silver Ore to upgrade your boots.`;
            }
            if (state.hero.savedData.money < 100) {
                return `I'm sorry but you don't have enough money.`;
            }
            state.hero.savedData.silverOre -= 2;
            state.hero.savedData.money -= 100;
            return `Excellent! Take a look at these!{item:leatherBoots=2}`;
        },
        no: 'Another time then.'
    },
    options: [
        // The smith will offer to upgrade your leather boots once the Chakram is fully upgraded and you bring him the recipe.
        {
            logicCheck: canUpgradeLeatherBoots,
            text: [
                {
                    dialogueIndex: -1,
                    dialogueType: 'subquest',
                    text: `{@cityArmorSmith.upgrade}`,
                },
            ],
        },
        // TODO: Add an option where he gives the blue prints for the gold mail once all boots are upgraded.
        // All upgrades completed.
        {
            logicCheck: {
                requiredFlags: ['$cloudBoots:2', '$ironBoots:2', '$leatherBoots:2'],
            },
            text: [
                {
                    dialogueIndex: 145,
                    text: 'Those are all some fine looking boots!',
                },
            ],
        },
        // The armor smith will give you a hint about the flying boots recipe once you've upgraded the leather boots,
        // provided you already possess the cloud boots.
        {
            logicCheck: {
                requiredFlags: ['$leatherBoots:2', '$cloudBoots'],
                excludedFlags: ['$flyingBoots'],
            },
            text: [
                {
                    dialogueIndex: 146,
                    dialogueType: 'hint',
                    text: `
                        The weapon smith here once had a fanciful idea for some magic boots.
                        {|}Maybe he'd tell you about them under the right circumstances.
                    `,
                },
            ],
        },
        // Hint that the player can still upgrade some of their remaining boots.
        {
            logicCheck: {
                requiredFlags: ['$leatherBoots:2', '$cloudBoots', '$ironBoots'],
            },
            text: [
                {
                    dialogueIndex: 147,
                    text: `
                        I can't help but think those other boots of yours could be improved somehow.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$leatherBoots:2'],
            },
            text: [
                {
                    dialogueIndex: 148,
                    text: 'Hope you are enjoying those boots!',
                },
            ],
        },
        {
            logicCheck: {},
            text: [
                {
                    dialogueIndex: 149,
                    text: `I don't usually make anything in your size little one...`,
                },
                {
                    dialogueIndex: 150,
                    dialogueType: 'hint',
                    text: `With the right schematics and materials I might be able to make you something nice, for a cost!`,
                },
            ],
            repeatIndex: 1,
        },
    ],
};

dialogueHash.citySmith = {
    key: 'citySmith',
    mappedOptions: {
        upgrade: (state: GameState) => {
            if (!(state.hero.savedData.weapon & 1)) {
                return `I don't possess the tools to work on such a fine weapon.`;
            }
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
        no: 'Another time then.',
        citySmithReward: isRandomizer ? `{item:flyingBoots} {flag:citySmithReward}` : `
            Wait!{-}
            Let me take a look at those boots...
            {|}I once had a dream I made a pair of boots that could walk on the very air itself.
            {|}I don't possess the skill to make them, but take these blueprints with you.
            {|}If there really is a Spirit Forge, maybe they can make my dream a reality!
            {item:flyingBoots} {flag:citySmithReward}
        `,
    },
    options: [
        // The smith will give you blueprints for the flying boots once you obtain all normal upgrades
        // provided you have the cloud boots.
        {
            logicCheck: {
                requiredFlags: ['$normalDamage', '$normalRange', '$cloudBoots'],
                excludedFlags: ['citySmithReward']
            },
            text: [
                {
                    dialogueIndex: -1,
                    dialogueType: 'subquest',
                    text: `{@citySmith.citySmithReward}`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$normalDamage', '$normalRange', '$cloudBoots:2'],
            },
            text: [
                {
                    dialogueIndex: 151,
                    text: `You did it!{|}Ain't they every bit the wonder I said they were?`,
                },
            ],
        },
        // Upgrades complete, flying boots blueprints obtained, but not used.
        {
            logicCheck: {
                requiredFlags: ['$normalDamage', '$normalRange', '$flyingBoots'],
                excludedFlags: ['$cloudBoots:2'],
            },
            text: [
                {
                    dialogueIndex: 152,
                    text: `There must be a smith out there somewhere that can make my dream come true!`,
                },
            ],
        },
        // All upgrades completed, no flying boots.
        {
            logicCheck: {
                requiredFlags: ['$normalDamage', '$normalRange', '$spiritDamage', '$spiritRange', '$leatherBoots:2'],
            },
            text: [
                {
                    dialogueIndex: 153,
                    text: `I've given it my all, the rest is up to you!`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$normalDamage', '$normalRange', '$spiritDamage', '$spiritRange'],
                excludedFlags: ['$spikeBoots'],
            },
            text: [
                {
                    dialogueIndex: 154,
                    text: `There's still aught I could do for you with the right blueprints!`,
                },
            ],
        },
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
                requiredFlags: ['$weapon:1'],
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


dialogueHash.forgeArmorSmith = {
    key: 'forgeArmorSmith',
    mappedOptions: {
        upgrade: (state: GameState) => {
            const textParts = ['I can upgrade your equipment for 200 Jade and some Gold Ore.', '{choice:Upgrade Equipment?'];
            if (isLogicValid(state, canUpgradeCloudBoots)) {
                textParts.push('|Cloud Boots:forgeArmorSmith.chooseCloudBoots');
            }
            if (isLogicValid(state, canUpgradeIronBoots)) {
                textParts.push('|Iron Boots:forgeArmorSmith.chooseIronBoots');
            }
            textParts.push('|No:forgeArmorSmith.no}');
            return textParts.join('');
        },
        chooseIronBoots: `
            With these schematics I can upgrade your Iron Boots into a pair of our famous Forge Boots.
            {|}They are light as leather and impervious to heat!
            {|}It will only cost you 200 Jade and some Gold Ore.
            {choice:Upgrade Iron Boots?|Yes:forgeArmorSmith.upgradeIronBoots|No:forgeArmorSmith.no}
        `,
        upgradeIronBoots: (state: GameState) => {
            if (state.hero.savedData.goldOre < 1) {
                return `I'll need some Gold Ore to upgrade your boots.`;
            }
            if (state.hero.savedData.money < 200) {
                return `I'm sorry but you don't have enough money.`;
            }
            state.hero.savedData.goldOre -= 1;
            state.hero.savedData.money -= 200;
            return `Excellent! Take a look at these!{item:ironBoots=2}`;
        },
        chooseCloudBoots: `
            With these schematics I can upgrade your Cloud Boots into a pair of magical Flying Boots.
            {|}They can literally walk on air as long as you don't stop moving!
            {|}It will only cost you 200 Jade and some Gold Ore.
            {choice:Upgrade Cloud Boots?|Yes:forgeArmorSmith.upgradeCloudBoots|No:forgeArmorSmith.no}
        `,
        upgradeCloudBoots: (state: GameState) => {
            if (state.hero.savedData.goldOre < 1) {
                return `I'll need some Gold Ore to upgrade your boots.`;
            }
            if (state.hero.savedData.money < 200) {
                return `I'm sorry but you don't have enough money.`;
            }
            state.hero.savedData.goldOre -= 1;
            state.hero.savedData.money -= 200;
            return `Excellent! Take a look at these!{item:cloudBoots=2}`;
        },
        no: 'Another time then.'
    },
    options: [
        // The smith will offer to upgrade your leather boots once the Chakram is fully upgraded and you bring him the recipe.
        {
            // TODO: Add an option for upgrading the silver mail to gold mail.
            logicCheck: orLogic(canUpgradeIronBoots, canUpgradeCloudBoots),
            text: [
                {
                    dialogueIndex: -1,
                    dialogueType: 'subquest',
                    text: `{@forgeArmorSmith.upgrade}`,
                },
            ],
        },
        // All upgrades completed.
        {
            logicCheck: {
                requiredFlags: ['$cloudBoots:2', '$ironBoots:2'],
            },
            text: [
                {
                    dialogueIndex: 155,
                    text: `With thos boots, you'll be unstoppable!`,
                },
            ],
        },
        // The forge armor smith will give you a hint about the forge boots recipe if you have the iron boots.
        {
            logicCheck: {
                requiredFlags: ['$ironBoots'],
                excludedFlags: ['$forgeBoots'],
            },
            text: [
                {
                    dialogueIndex: 156,
                    dialogueType: 'hint',
                    text: `
                        For the right customer, my friend here might teach you the secrets of our Forge Boots.
                    `,
                },
            ],
        },
        {
            logicCheck: {},
            text: [
                {
                    dialogueIndex: 157,
                    dialogueType: 'hint',
                    text: `We've been instructed to help you, but I won't do anything without the proper schematics.`,
                },
            ],
            repeatIndex: 1,
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
            return `I can upgrade your ${CHAKRAM_2_NAME} if you can find Gold Ore.
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
        no: 'Another time then.',
        forgeSmithReward: isRandomizer ? `{item:forgeBoots} {flag:forgeSmithReward}` : `
            With the right materials my friend could turn those Iron Boots into a pair of our famous Forge Boots.
            {item:forgeBoots} {flag:forgeSmithReward}
        `,
    },
    options: [
        // The forge smith will give you blueprints for the forge boots once you obtain all spirit upgrades
        // provided you have the iron boots.
        {
            logicCheck: {
                requiredFlags: ['$spiritDamage', '$spiritRange', '$ironBoots'],
                excludedFlags: ['forgeSmithReward']
            },
            text: [
                {
                    dialogueIndex: -1,
                    dialogueType: 'subquest',
                    text: `{@forgeSmith.forgeSmithReward}`,
                },
            ],
        },
        // All upgrades completed.
        {
            logicCheck: {
                requiredFlags: ['$normalDamage', '$normalRange', '$spiritDamage', '$spiritRange', '$cloudBoots:2', '$ironBoots:2'],
            },
            text: [
                {
                    dialogueIndex: 158,
                    text: 'How are you enjoying my masterpieces?',
                },
            ],
        },
        // Once all weapon upgrades are purchased the smith gives hints about remaining boot upgrades.
        {
            logicCheck: {
                requiredFlags: ['$normalDamage', '$normalRange', '$spiritDamage', '$spiritRange'],
            },
            text: [
                {
                    dialogueIndex: 50,
                    text: 'With the right blueprints, I could craft you a real masterpiece.',
                },
            ],
        },
        // Once all spirit upgrades are purchased the smith reminds you about the regular blacksmith.
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
