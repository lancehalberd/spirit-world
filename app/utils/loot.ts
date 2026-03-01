
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
export function isActiveTool(lootType: LootType): lootType is ActiveTool {
    return activeTools.includes(lootType as ActiveTool);
}
const passiveTools: PassiveTool[] = [
    'gloves', 'roll', 'nimbusCloud', 'catEyes', 'spiritSight',
    'trueSight', 'astralProjection', 'teleportation', 'ironSkin', 'goldMail', 'phoenixCrown',
    'waterBlessing', 'fireBlessing', 'lightningBlessing',
];
export function isPassiveTool(lootType: LootType): lootType is PassiveTool {
    return passiveTools.includes(lootType as PassiveTool);
}
const elementLoot: MagicElement[] = ['fire', 'lightning', 'ice'];
export function isMagicElement(lootType: LootType): lootType is MagicElement {
    return elementLoot.includes(lootType as MagicElement);
}
const equipment: Equipment[] = ['leatherBoots', 'cloudBoots', 'ironBoots'];
export function isEquipment(lootType: LootType): lootType is Equipment {
    return equipment.includes(lootType as Equipment);
}

export function doesLootRequireLevel(lootType: LootType) {
    return lootType === 'weapon' || isActiveTool(lootType) || isPassiveTool(lootType) || isEquipment(lootType);
}

export function doesLootRequireAmount(lootType: LootType) {
    return lootType === 'money';
}

export function getLootLevel(state: GameState, loot: LootData): number {
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
