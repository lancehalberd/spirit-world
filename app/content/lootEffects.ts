import { setLeftTool, setRightTool } from 'app/content/menu';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { saveGame } from 'app/utils/saveGame';


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
            state.hero.savedData.weapon = applyUpgrade(state.hero.savedData.weapon, loot);
        } else if (['bow', 'staff', 'clone', 'cloak'].includes(loot.lootType)) {
            if (!state.hero.savedData.leftTool && state.hero.savedData.rightTool !== loot.lootType) {
                setLeftTool(state, loot.lootType as ActiveTool);
            } else if (!state.hero.savedData.rightTool && state.hero.savedData.leftTool !== loot.lootType) {
                setRightTool(state, loot.lootType as ActiveTool);
            }
            //console.log(loot.lootType, state.hero.savedData.activeTools[loot.lootType]);
            state.hero.savedData.activeTools[loot.lootType] = applyUpgrade(state.hero.savedData.activeTools[loot.lootType], loot);
            //console.log('->', loot.lootType, state.hero.savedData.activeTools[loot.lootType]);
        } else if ([
            'gloves', 'roll', 'nimbusCloud', 'catEyes', 'spiritSight',
            'trueSight', 'astralProjection', 'teleportation', 'ironSkin', 'goldMail', 'phoenixCrown',
            'waterBlessing', 'fireBlessing', 'lightningBlessing',
        ].includes(loot.lootType)) {
            //console.log(loot.lootType, state.hero.savedData.passiveTools[loot.lootType]);
            state.hero.savedData.passiveTools[loot.lootType] = applyUpgrade(state.hero.savedData.passiveTools[loot.lootType], loot);
            //console.log('->', loot.lootType, state.hero.savedData.passiveTools[loot.lootType]);
        } else if ([
            'fire', 'lightning', 'ice'
        ].includes(loot.lootType)) {
            state.hero.savedData.elements[loot.lootType] = applyUpgrade(state.hero.savedData.elements[loot.lootType], loot);
        }  else if ([
            'cloudBoots', 'ironBoots'
        ].includes(loot.lootType)) {
            state.hero.savedData.equipment[loot.lootType] = applyUpgrade(state.hero.savedData.equipment[loot.lootType], loot);
        } else if (loot.lootType === 'money') {
            state.hero.savedData.money += (loot.lootAmount || 1);
        } else if (loot.lootType === 'silverOre') {
            state.hero.savedData.silverOre++;
        } else if (loot.lootType === 'goldOre') {
            state.hero.savedData.goldOre++;
        } else if (loot.lootType === 'victoryPoint') {
            state.hero.savedData.victoryPoints += (loot.lootAmount || 1);
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
        state.hero.life = Math.min(state.hero.life + 1, state.hero.savedData.maxLife);
    },
    peachOfImmortality: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.savedData.maxLife++;
        state.hero.life = state.hero.savedData.maxLife;
    },
    peachOfImmortalityPiece: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.savedData.peachQuarters++;
        if (state.hero.savedData.peachQuarters >= 4) {
            state.hero.savedData.peachQuarters -= 4;
            if (simulate) {
                state.hero.savedData.maxLife++;
            }
            // You will gain the full peach from the dialogue effect.
        }
    },
    secondChance: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.savedData.hasRevive = true;
        state.reviveTime = state.fieldTime;
    },
    spiritPower: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        if (loot.lootType === 'spiritPower') {
            if (!state.hero.savedData.passiveTools.spiritSight) {
                state.hero.savedData.passiveTools.spiritSight = 1;
            } else if (!state.hero.savedData.passiveTools.astralProjection) {
                state.hero.savedData.passiveTools.astralProjection = 1;
            } else {
                state.hero.savedData.passiveTools.teleportation = 1;
            }
        }
    }
}
