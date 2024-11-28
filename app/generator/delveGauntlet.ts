import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {zones} from 'app/content/zones/zoneHash';
import {gameModifiers} from 'app/gameConstants';
import {addDoorAndClearForegroundTiles} from 'app/generator/doors';
import {getDefaultSavedState} from 'app/savedState'
import Random from 'app/utils/Random';
import {applyItemsToSavedState} from 'app/utils/applyItemsToSavedState'

// TODO:
// support boot upgrades as progressive items
// support weapon upgrades as progresive items

const baseEntranceDefinition: EntranceDefinition = {
    type: 'door',
    d: 'down',
    style: 'stone',
    status: 'closed',
    targetZone: 'delve',
    x: 96,
    y: 240,
};
const baseExitDefinition: EntranceDefinition = {
    type: 'door',
    d: 'up',
    style: 'stone',
    status: 'closedEnemy',
    targetZone: 'delve',
    x: 112,
    y: 16,
};
const baseLootDefinition: LootObjectDefinition = {
    type: 'loot',
    lootType: 'money',
    lootLevel: 0,
    status: 'hiddenEnemy',
    x: 150,
    y: 40,
};
const saveStatueDefinition: SimpleObjectDefinition = {
    type: 'saveStatue',
    status: 'hiddenEnemy',
    x: 80,
    y: 44,
}
const levelUpTrigger: NarrationDefinition = {
    type: 'narration',
    status: 'normal',
    x: 112,
    y: 48,
    w: 32,
    h: 16,
    message: '{@delveGauntlet.increaseDifficulty}',
}
dialogueHash.delveGauntlet = {
    key: 'delveGauntlet',
    mappedOptions: {
        increaseDifficulty: (state: GameState) => {
            // Always increase the enemy difficulty.
            gameModifiers.globalEnemyDifficulty++;
            // Apply hard mode modifiers statically if they aren't set yet.
            gameModifiers.globalDamageTaken = 1.5;
            gameModifiers.globalDamageDealt = 0.75;
            gameModifiers.spiritEnergyCooldown = 1.5;
            gameModifiers.spiritEnergyRegeneration = 0.75;
            gameModifiers.bonusSpiritRegeneration = 0.75;
            gameModifiers.bowDamage = 0.75;
            console.log('Difficulty up: ', gameModifiers.globalEnemyDifficulty);
            return '';
        },
    },
    options: [],
}

const sectionOffsets = [{x: 0, y: 0}, {x: 256, y: 0}, {x: 0, y: 256}, {x: 256, y: 256}];

const lootPool: LootType[] = [
    'weapon',
    'bow',
    'staff',
    'cloak',
    'clone',
    'roll', 'roll',
    'gloves', 'gloves',
    'trueSight', 'ironSkin',
    'waterBlessing', 'fireBlessing', 'lightningBlessing',
    'cloudBoots', 'ironBoots',
    'fire', 'ice', 'lightning',
    'peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece',
    'peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece',
    'peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece',
    'peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece',
    'peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece',
    'peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece',
    'peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece',
    'peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece','peachOfImmortalityPiece',
    'peachOfImmortality','peachOfImmortality','peachOfImmortality','peachOfImmortality',
];
const totalRooms = 64;
while (lootPool.length < totalRooms) {
    lootPool.push('empty');
}

function createDelveGauntlet() {
    const zone: Zone = zones.delve;
    const spiritGrid = zone.floors[0].spiritGrid;
    let doorIndex = 0;
    const randomLoot = Random.shuffle(lootPool);
    for (const row of spiritGrid) {
        for (const spiritArea of row) {
            spiritArea.parentDefinition.objects = spiritArea.parentDefinition.objects || [];
            // Make sure we never save the status of defeated enemies, otherwise they won't respawn.
            for (const object of spiritArea.parentDefinition.objects) {
                if (object.type === 'enemy' || object.type === 'boss') {
                    object.saveStatus = 'never';
                }
            }
            for (const {x, y} of sectionOffsets) {
                const entranceId = `door-${doorIndex}`;
                const exitIndex = (doorIndex + 1) % totalRooms;
                const exitId = `door-${exitIndex}`;
                const subSectionIndex = doorIndex % 8;
                const sectionIndex = ((doorIndex - subSectionIndex) / 8) | 0;
                addDoorAndClearForegroundTiles({
                    ...baseEntranceDefinition,
                    id: entranceId,
                    x: baseEntranceDefinition.x + x,
                    y: baseEntranceDefinition.y + y,
                    targetObjectId: entranceId,
                    locationCue: `${sectionIndex + 1} - ${subSectionIndex + 1}`,
                }, spiritArea.parentDefinition, spiritArea);
                addDoorAndClearForegroundTiles({
                    ...baseExitDefinition,
                    id: exitId,
                    x: baseExitDefinition.x + x,
                    y: baseExitDefinition.y + y,
                    targetObjectId: exitId,
                }, spiritArea.parentDefinition, spiritArea);

                const lootType = randomLoot.pop();
                if (lootType && lootType !== 'empty') {
                    spiritArea.parentDefinition.objects.push({
                        ...baseLootDefinition,
                        id: `delveGauntletLoot-${doorIndex}`,
                        x: baseLootDefinition.x + x,
                        y: baseLootDefinition.y + y,
                        lootType,
                    });
                }
                if (doorIndex % 8 === 7) {
                    spiritArea.parentDefinition.objects.push({
                        ...saveStatueDefinition,
                        id: `delveGauntletSave-${doorIndex}`,
                        x: saveStatueDefinition.x + x,
                        y: saveStatueDefinition.y + y,
                    });
                }
                doorIndex++;
                if (exitIndex === 0) {
                    // This trigger will increase the enemy difficulty when returning to the first room.
                    spiritArea.parentDefinition.objects.push({
                        ...levelUpTrigger,
                        saveStatus: 'never',
                        x: levelUpTrigger.x + x,
                        y: levelUpTrigger.y + y,
                    });
                }
            }
        }
    }
}
createDelveGauntlet();

export const SPAWN_LOCATION_GAUNTLET: ZoneLocation = {
    zoneKey: 'delve',
    floor: 0,
    x: 120,
    y: 192,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};

export const gauntletStartingState = applyItemsToSavedState(getDefaultSavedState(), {weapon: 1, secondChance: 1});
