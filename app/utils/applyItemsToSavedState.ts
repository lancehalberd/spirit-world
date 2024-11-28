import { cloneDeep } from 'app/utils/index';

const weaponUpgradeKeys: WeaponUpgrades[] = ['normalDamage', 'normalRange', 'spiritDamage', 'spiritRange'];

export function applyItemsToSavedState(savedState: SavedState, items: {[key: string]: number}, objectFlags: string[] = []): SavedState {
    const newState: SavedState = cloneDeep(savedState);
    for (const flag of objectFlags) {
        newState.objectFlags[flag] = true;
    }
    for (let key in items) {
        if (key === 'maxLife') {
            newState.savedHeroData.maxLife += items[key];
            continue;
        }
        if (key === 'secondChance') {
            newState.savedHeroData.hasRevive = true;
            continue;
        }
        if (key === 'money') {
            newState.savedHeroData.money += items[key];
            continue;
        }
        if (key === 'silverOre') {
            newState.savedHeroData.silverOre += items[key];
            continue;
        }
        if (key === 'goldOre') {
            newState.savedHeroData.goldOre += items[key];
            continue;
        }
        if (key === 'weapon') {
            newState.savedHeroData.weapon = items[key];
            continue;
        }
        if (weaponUpgradeKeys.includes(key as WeaponUpgrades)) {
            newState.savedHeroData.weaponUpgrades[key as WeaponUpgrades] = true;
            continue;
        }
        if (key.indexOf(':') >= 0) {
            const [zoneKey, item] = key.split(':');
            newState.dungeonInventories[zoneKey] = {
                ...newState.dungeonInventories[zoneKey],
                [item]: items[key],
            };
            continue;
        }
        if (typeof newState.savedHeroData.activeTools[key as ActiveTool] !== 'undefined') {
            newState.savedHeroData.activeTools[key as ActiveTool] = items[key];
            continue;
        }
        if (typeof newState.savedHeroData.elements[key as MagicElement] !== 'undefined') {
            newState.savedHeroData.elements[key as MagicElement] = items[key];
            continue;
        }
        if (typeof newState.savedHeroData.equipment[key as Equipment] !== 'undefined') {
            newState.savedHeroData.equipment[key as Equipment] = items[key];
            continue;
        }
        if (typeof newState.savedHeroData.passiveTools[key as PassiveTool] !== 'undefined') {
            newState.savedHeroData.passiveTools[key as PassiveTool] = items[key];
            continue;
        }
        console.log('Could not find key', key, items[key]);
    }
    return newState;
}
