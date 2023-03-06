import { setLeftTool, setRightTool } from 'app/content/menu';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { saveGame } from 'app/utils/saveGame';

import {
    ActiveTool, BossObjectDefinition, DialogueLootDefinition,
    DungeonInventory, GameState, LootObjectDefinition,
    LootType
} from 'app/types';

type AnyLootDefinition = LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition;

function applyUpgrade(currentLevel: number, loot: LootObjectDefinition | BossObjectDefinition): number {
    // Negative number indicates losing loot, and currently is just for setting down the Tower Staff.
    if (loot.lootLevel < 0) {
        return Math.max(0, currentLevel + loot.lootLevel);
    }
    // Non-progressive upgrades specify the exact level of the item. Lower level items will be ignored
    // if the player already possesses a better version.
    if (loot.lootLevel) {
        //console.log(loot.lootType, 'max', currentLevel, loot.lootLevel);
        return Math.max(currentLevel, loot.lootLevel);
    }
    //console.log(loot.lootType, 'increment', currentLevel);
    return currentLevel + 1;
}

function getDungeonInventory(state: GameState): DungeonInventory {
    return state.savedState.dungeonInventories[state.location.logicalZoneKey] || {
        bigKey: false,
        map: false,
        smallKeys: 0,
    };
}
function updateDungeonInventory(state: GameState, inventory: DungeonInventory, save: boolean = true): void {
    state.savedState.dungeonInventories[state.location.logicalZoneKey] = inventory;
    if (save) {
        saveGame(state);
    }
}

export const lootEffects:Partial<{[key in LootType]: (state: GameState, loot: AnyLootDefinition, simulate?: boolean) => void}> = {
    unknown: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        if (loot.lootType === 'weapon') {
            state.hero.weapon = applyUpgrade(state.hero.weapon, loot);
        } else if (['bow', 'staff', 'clone', 'cloak'].includes(loot.lootType)) {
            if (!state.hero.leftTool && state.hero.rightTool !== loot.lootType) {
                setLeftTool(state, loot.lootType as ActiveTool);
            } else if (!state.hero.rightTool && state.hero.leftTool !== loot.lootType) {
                setRightTool(state, loot.lootType as ActiveTool);
            }
            //console.log(loot.lootType, state.hero.activeTools[loot.lootType]);
            state.hero.activeTools[loot.lootType] = applyUpgrade(state.hero.activeTools[loot.lootType], loot);
            //console.log('->', loot.lootType, state.hero.activeTools[loot.lootType]);
        } else if ([
            'gloves', 'roll', 'nimbusCloud', 'catEyes', 'spiritSight',
            'trueSight', 'astralProjection', 'teleportation', 'ironSkin', 'goldMail', 'phoenixCrown',
            'waterBlessing', 'fireBlessing', 'lightningBlessing',
        ].includes(loot.lootType)) {
            //console.log(loot.lootType, state.hero.passiveTools[loot.lootType]);
            state.hero.passiveTools[loot.lootType] = applyUpgrade(state.hero.passiveTools[loot.lootType], loot);
            //console.log('->', loot.lootType, state.hero.passiveTools[loot.lootType]);
        } else if ([
            'fire', 'lightning', 'ice'
        ].includes(loot.lootType)) {
            state.hero.elements[loot.lootType] = applyUpgrade(state.hero.elements[loot.lootType], loot);
        }  else if ([
            'cloudBoots', 'ironBoots'
        ].includes(loot.lootType)) {
            state.hero.equipment[loot.lootType] = applyUpgrade(state.hero.equipment[loot.lootType], loot);
        } else if (loot.lootType === 'money') {
            state.hero.money += (loot.lootAmount || 1);
        } else if (loot.lootType === 'silverOre') {
            state.hero.silverOre++;
        } else if (loot.lootType === 'goldOre') {
            state.hero.goldOre++;
        } else if (loot.lootType === 'victoryPoint') {
            state.hero.victoryPoints += (loot.lootAmount || 1);
        }  else {
            console.error('Unhandled loot type:', loot.lootType);
            // throw new Error('Unhandled loot type: ' + loot.lootType);
        }
        updateHeroMagicStats(state);
    },
    bigKey: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        const inventory = getDungeonInventory(state);
        inventory.bigKey = true;
        updateDungeonInventory(state, inventory, false);
    },
    map: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        const inventory = getDungeonInventory(state);
        inventory.map = true;
        state.map.needsRefresh = true;
        updateDungeonInventory(state, inventory, false);
    },
    smallKey: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        const inventory = getDungeonInventory(state);
        inventory.smallKeys++;
        updateDungeonInventory(state, inventory, false);
    },
    peach: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.life = Math.min(state.hero.life + 1, state.hero.maxLife);
    },
    peachOfImmortality: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.maxLife++;
        state.hero.life = state.hero.maxLife;
    },
    peachOfImmortalityPiece: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.peachQuarters++;
        if (state.hero.peachQuarters >= 4) {
            state.hero.peachQuarters -= 4;
            if (simulate) {
                state.hero.maxLife++;
            }
            // You will gain the full peach from the dialogue effect.
        }
    },
    secondChance: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.hasRevive = true;
        state.reviveTime = state.fieldTime;
    },
    spiritPower: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        if (loot.lootType === 'spiritPower') {
            if (!state.hero.passiveTools.spiritSight) {
                state.hero.passiveTools.spiritSight = 1;
            } else if (!state.hero.passiveTools.astralProjection) {
                state.hero.passiveTools.astralProjection = 1;
            } else {
                state.hero.passiveTools.teleportation = 1;
            }
        }
    }
}
