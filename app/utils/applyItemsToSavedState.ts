import { cloneDeep } from 'app/utils/index';
import {
    isActiveTool, isCollectible, isConsumable,
    isEquipment, isMagicElement, isPassiveTool,
    isWeaponUpgrade,
} from 'app/utils/loot';


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
        if (isCollectible(key)) {
            savedState.savedHeroData.collectibles[key]++;
            savedState.savedHeroData.collectibleTotals[key]++;
        }
        if (isConsumable(key)) {
            savedState.savedHeroData.consumables[key]++;
            savedState.savedHeroData.consumableTotals[key]++;
        }
        if (key === 'weapon') {
            newState.savedHeroData.weapon = items[key];
            continue;
        }
        if (isWeaponUpgrade(key)) {
            newState.savedHeroData.weaponUpgrades[key] = true;
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
        if (isActiveTool(key)) {
            newState.savedHeroData.activeTools[key] = items[key];
            continue;
        }
        if (isMagicElement(key)) {
            newState.savedHeroData.elements[key] = items[key];
            continue;
        }
        if (isEquipment(key)) {
            newState.savedHeroData.equipment[key] = items[key];
            continue;
        }
        if (isPassiveTool(key)) {
            newState.savedHeroData.passiveTools[key] = items[key];
            continue;
        }
        console.log('Could not find key', key, items[key]);
    }
    return newState;
}
