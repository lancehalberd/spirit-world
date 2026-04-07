import {setLeftTool, setRightTool} from 'app/utils/menu';
import {playAreaSound} from 'app/musicController';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {
    applyUpgrade,
    gainCollectible,
    gainConsumable,
    isActiveTool, isBlueprints, isCollectible, isConsumable,
    isEquipment, isMagicElement, isPassiveTool,
} from 'app/utils/loot';
import {saveGame} from 'app/utils/saveGame';
import {playSound} from 'app/utils/sounds';

function getDungeonInventory(state: GameState): DungeonInventory {
    return state.savedState.dungeonInventories[state.location.logicalZoneKey] || {
        bigKey: false,
        map: false,
        smallKeys: 0,
        totalSmallKeys: 0,
    };
}
function updateDungeonInventory(state: GameState, inventory: DungeonInventory, save: boolean = true): void {
    state.savedState.dungeonInventories[state.location.logicalZoneKey] = inventory;
    if (save) {
        saveGame(state);
    }
}

export const lootEffects:Partial<{[key in LootType]: (state: GameState, loot: LootData, simulate?: boolean) => void}> = {
    unknown: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        const {lootType} = loot;
        if (loot.lootType === 'weapon') {
            state.hero.savedData.weapon = applyUpgrade(state.hero.savedData.weapon, loot);
        } else if (isActiveTool(lootType)) {
            if (!state.hero.savedData.leftTool && state.hero.savedData.rightTool !== loot.lootType) {
                setLeftTool(state, lootType);
            } else if (!state.hero.savedData.rightTool && state.hero.savedData.leftTool !== lootType) {
                setRightTool(state, lootType);
            }
            //console.log(lootType, state.hero.savedData.activeTools[lootType]);
            state.hero.savedData.activeTools[lootType] = applyUpgrade(state.hero.savedData.activeTools[lootType], loot);
            //console.log('->', loot.lootType, state.hero.savedData.activeTools[loot.lootType]);
        } else if (isPassiveTool(lootType)) {
            //console.log(loot.lootType, state.hero.savedData.passiveTools[loot.lootType]);
            state.hero.savedData.passiveTools[lootType] = applyUpgrade(state.hero.savedData.passiveTools[lootType], loot);
            //console.log('->', loot.lootType, state.hero.savedData.passiveTools[loot.lootType]);
        } else if (isMagicElement(lootType)) {
            state.hero.savedData.elements[lootType] = applyUpgrade(state.hero.savedData.elements[lootType], loot);
        } else if (isEquipment(lootType)) {
            state.hero.savedData.equipment[lootType] = applyUpgrade(state.hero.savedData.equipment[lootType], loot);
        } else if (isBlueprints(loot.lootType)) {
            state.hero.savedData.blueprints[loot.lootType] = 1;
        } else if (loot.lootType === 'money') {
            state.hero.savedData.money += (loot.lootAmount || 1);
        } else if (isCollectible(lootType)) {
            gainCollectible(state, lootType);
        } else if (isConsumable(lootType)) {
            gainConsumable(state, lootType);
        } else {
            console.error('Unhandled loot type:', loot.lootType);
            // throw new Error('Unhandled loot type: ' + loot.lootType);
        }
        updateHeroMagicStats(state, false);
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
        inventory.totalSmallKeys++;
        updateDungeonInventory(state, inventory, false);
    },
    peach: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        if (state.hero.life >= state.hero.savedData.maxLife
            && state.hero.savedData.passiveTools.peachBasket
            // Basket only holds 30 peaches
            && state.hero.savedData.collectibles.peach < 30
        ) {
            gainCollectible(state, 'peach');
            // TODO: Consider a different sound effect for collecting a peach
            playAreaSound(state, state.areaInstance, 'drink');
        } else {
            state.hero.life = Math.min(state.hero.life + 1, state.hero.savedData.maxLife);
            playAreaSound(state, state.areaInstance, 'drink');
        }
    },
    peachOfImmortality: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        gainCollectible(state, 'peachOfImmortality');
        state.hero.savedData.maxLife++;
        state.hero.life = state.hero.savedData.maxLife;
    },
    peachOfImmortalityPiece: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        gainCollectible(state, 'peachOfImmortalityPiece');
        if (state.hero.savedData.collectibles.peachOfImmortalityPiece >= 4) {
            state.hero.savedData.collectibles.peachOfImmortalityPiece -= 4;
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

export function useConsumable(state: GameState, consumable: Consumable): void {
    if (!(state.hero.savedData.consumables[consumable] > 0)) {
        playSound('error');
        return;
    }
    if (consumable === 'healthPotion') {
        // Cannot use health potion at full life.
        if (state.hero.savedData.maxLife <= state.hero.life) {
            playSound('error');
            return;
        }
        state.hero.life = Math.min(state.hero.savedData.maxLife, (state.hero.life + 10));
        playSound('drink');
    }
    if (consumable === 'statusPotion') {
        state.hero.burnDuration = 0;
        state.hero.frozenDuration = 0;
        state.hero.shockDuration = 0;
        state.hero.statusPotionExpiresAt = Math.max(state.hero.statusPotionExpiresAt, state.fieldTime) + 60000;
        playSound('drink');
    }
    if (consumable === 'magicPotion') {
        state.hero.magicPotionExpiresAt = Math.max(state.hero.magicPotionExpiresAt, state.fieldTime) + 60000;
        playSound('drink');
    }
    state.hero.savedData.consumables[consumable]--;
}
