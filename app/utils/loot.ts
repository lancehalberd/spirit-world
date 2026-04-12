
const MAX_LEVEL = 2;
export function applyUpgrade(currentLevel: number, loot: LootData): number {
    // Non-progressive upgrades specify the exact level of the item.
    if (loot.lootLevel) {
        //console.log(loot.lootType, 'max', currentLevel, loot.lootLevel);
        return currentLevel | (1 << (loot.lootLevel - 1));
    }
    //console.log(loot.lootType, 'increment', currentLevel);
    for (let i = 0; i < MAX_LEVEL; i++) {
        const bit = 1 << i;
        if (!(currentLevel & bit)) {
            return currentLevel | bit;
        }
    }
    return currentLevel;
}

const activeTools: ActiveTool[] = ['bow', 'staff', 'clone', 'cloak'];
export function isActiveTool(lootType: string): lootType is ActiveTool {
    return activeTools.includes(lootType as ActiveTool);
}
const passiveTools: PassiveTool[] = [
    'gloves', 'roll', 'nimbusCloud', 'catEyes', 'spiritSight',
    'trueSight', 'astralProjection', 'teleportation', 'ironSkin', 'armor', 'phoenixCrown',
    'waterBlessing', 'fireBlessing', 'lightningBlessing',
    'peachBasket', 'arDevice',
];
export function isPassiveTool(lootType: string): lootType is PassiveTool {
    return passiveTools.includes(lootType as PassiveTool);
}
const magicElement: MagicElement[] = ['fire', 'lightning', 'ice'];
export function isMagicElement(lootType: string): lootType is MagicElement {
    return magicElement.includes(lootType as MagicElement);
}
const equipment: Equipment[] = ['leatherBoots', 'cloudBoots', 'ironBoots'];
export function isEquipment(lootType: string): lootType is Equipment {
    return equipment.includes(lootType as Equipment);
}

const collectibles: Collectible[] = [
    'silverOre', 'goldOre', 'victoryPoint',
];
export function isCollectible(lootType: string): lootType is Collectible {
    return collectibles.includes(lootType as Collectible);
}
export function gainCollectible(state: GameState, collectible: Collectible, amount = 1) {
    state.hero.savedData.collectibles[collectible] += amount;
    state.hero.savedData.collectibleTotals[collectible] += amount;
}

const consumables: Consumable[] = [
    'healthPotion', 'statusPotion', 'magicPotion'
];
export function isConsumable(lootType: string): lootType is Consumable {
    return consumables.includes(lootType as Consumable);
}
export function gainConsumable(state: GameState, consumable: Consumable) {
    state.hero.savedData.consumables[consumable]++;
    state.hero.savedData.consumableTotals[consumable]++;
}

const blueprints: Blueprints[] = [
    'spikeBoots', 'flyingBoots', 'forgeBoots',
    'silverMailSchematics', 'goldMailSchematics',
    'healthPotionSchematics', 'statusPotionSchematics', 'magicPotionSchematics',
];
export function isBlueprints(lootType: LootType): lootType is Blueprints {
    return blueprints.includes(lootType as Blueprints);
}

const dungeonLoot: DungeonLoot[] = [
    'map', 'smallKey', 'bigKey',
];
export function isDungeonLoot(lootType: LootType): lootType is DungeonLoot {
    return dungeonLoot.includes(lootType as DungeonLoot);
}



const weaponUpgrades: WeaponUpgrades[] = ['normalDamage', 'normalRange', 'spiritDamage', 'spiritRange'];
export function isWeaponUpgrade(lootType: string): lootType is WeaponUpgrades {
    return weaponUpgrades.includes(lootType as WeaponUpgrades);
}

export function doesLootRequireLevel(lootType: string) {
    return lootType === 'weapon' || isActiveTool(lootType) || isPassiveTool(lootType) || isEquipment(lootType);
}

export function doesLootRequireAmount(lootType: string) {
    return lootType === 'money';
}

export function getLootLevel(state: GameState, loot: LootData): number {
    // Default to the current loot level for loot that requires a level and has non defined.
    if (loot.lootLevel === undefined && doesLootRequireLevel(loot.lootType)) {
        return getCurrentLootValue(state, loot.lootType);
    }
    // 0 represents progressive loot. If the loot is not progressive, it has
    // the exact level given (or not given for many items that have no concept of level).
    if (loot.lootLevel !== 0 || !doesLootRequireLevel(loot.lootType)) {
        return loot.lootLevel;
    }
    const currentLevel = getCurrentLootValue(state, loot.lootType);
    // Return 1 based index of the first bit greater than the current value.
    // Example:
    //   Current value is 3(2 | 1) = 0x11.
    //   First larger bit is 0x100 @ index 3, return 3.
    for (let i = 0; i < MAX_LEVEL; i++) {
        const bit = 1 << i;
        if (bit > currentLevel) {
            return i + 1;
        }
    }
    // Default to max level if they already have the highest level gear.
    return MAX_LEVEL;
}
window.getLootLevel = getLootLevel;

function getCurrentLootValue(state: GameState, lootType: LootType): number {
    if (lootType === 'weapon') {
        return state.hero.savedData.weapon;
    } else if (isActiveTool(lootType)) {
        return state.hero.savedData.activeTools[lootType];
    } else if (isPassiveTool(lootType)) {
        return state.hero.savedData.passiveTools[lootType];
    } else if (isEquipment(lootType)) {
        return state.hero.savedData.equipment[lootType];
    }
    throw new Error(`Loot Type has no levels: ${lootType}`);
}


export const allLootTypes: LootType[] = [
    'empty',
    'peachOfImmortality',
    'peachOfImmortalityPiece',
    'money',
    'weapon',
    'bigKey',
    'smallKey',
    'map',
    ...activeTools,
    ...passiveTools,
    ...collectibles,
    ...consumables,
    'secondChance',
    // This is the special progressive spirit power loot used by the randomizer.
    'spiritPower',
    ...equipment,
    ...magicElement,
    ...blueprints,
];
