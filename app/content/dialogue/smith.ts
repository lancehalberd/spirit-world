import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.citySmith = {
    key: 'citySmith',
    mappedOptions: {
        upgrade: `I can upgrade your weapon if you bring me the materials and 100 Jade.
                {choice:Upgrade Chakram?|Range:citySmith.range|Damage:citySmith.damage|No:citySmith.no}`,
        range: `I can improve the range of your Chakram if you bring me 2 Silver Ore
            {choice:Upgrade Range?|Yes:citySmith.craftRange|No:citySmith.upgrade}
        `,
        damage: `I can improve the damage of your Chakram if you bring me 3 Silver Ore
            {choice:Upgrade Damage?|Yes:citySmith.craftDamage|No:citySmith.upgrade}
        `,
        craftRange: `{craftNormalRange}`,
        craftDamage: `{craftNormalDamage}`,
        fail: 'This work doesn\'t come cheap, you need to bring more Jade.',
        no: 'Another time then.'
    },
    options: [
        // Once all upgrades are purchased the smith gives hints for the Forge.
        {
            logicCheck: {
                requiredFlags: ['$weapon', '$normalDamage', '$normalRange'],
            },
            text: [
                `They tell stories of smiths in the Spirit World with skills
                beyond those of any man.`,
                `Maybe there is a forge in the Spirit World that can help you.`,
                `Where do you suppose a mythical forge could be found?`
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$weapon'],
            },
            text: [
                `{@citySmith.upgrade}`
            ],
        },
        {
            logicCheck: {},
            text: [
                `You have no need of my services.`
            ],
        },
    ],
};


dialogueHash.forgeSmith = {
    key: 'forgeSmith',
    mappedOptions: {
        upgrade: `I can upgrade your Spirit Chakram if you bring me the materials and 200 Jade.
                {choice:Upgrade Chakram?|Range:forgeSmith.range|Damage:forgeSmith.damage|No:citySmith.no}`,
        range: `I need 1 Gold Ore and 2 Silver Ore to upgrade your range.
            {choice:Upgrade Range?|Yes:forgeSmith.craftRange|No:forgeSmith.upgrade}
        `,
        damage: `I need 1 Gold Ore and 3 Silver Ore to upgrade your damage
            {choice:Upgrade Damage?|Yes:forgeSmith.craftDamage|No:forgeSmith.upgrade}
        `,
        craftRange: `{craftSpiritRange}`,
        craftDamage: `{craftSpiritDamage}`,
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
                'Someday I will craft you a real masterpiece'
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$weapon:2'],
            },
            text: [
                `{@forgeSmith.upgrade}`
            ],
        },
        {
            logicCheck: {},
            text: [
                `I only work on the finest weapons.`
            ],
        },
    ],
};
