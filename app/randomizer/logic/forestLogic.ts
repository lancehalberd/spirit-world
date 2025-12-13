import {
    andLogic, canCross2Gaps, canRemoveLightStones,
    hasCloudBoots, hasWeapon, hasCatEyes, hasIce, hasInvisibility,
    hasMediumRange, hasBow, hasIronBoots, hasNimbusCloud,
    orLogic,
} from 'app/content/logic';

const canCrossSpikeRiver: LogicCheck = orLogic(hasCloudBoots, hasIce, hasInvisibility);
const canCrossCracks: LogicCheck = orLogic(hasCloudBoots, hasIce);


let zoneId = 'forest';
export const forestNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'forest',
        checks: [
            // This can be reached by diving under the water without iron boots.
            {objectId: 'forestLedgePiece'},
            // The plant blocking this can be defeated by throwing bushes at it.
            {objectId: 'forestMoney'},
            {objectId: 'forestSilver', logic: canCross2Gaps},
        ],
        paths: [
            {nodeId: 'treeVillage'},
            // Technically this path doesn't matter since overworld+forest are forced to be connected currently.
            {nodeId: 'nimbusCloud', logic: hasNimbusCloud},
            {nodeId: 'forestRiver', logic: hasIronBoots},
            {nodeId: 'forestSecretEntrance', logic: canRemoveLightStones},
        ],
        entranceIds: [
            'forestNorthEntrance',
            'forestTowerEntrance',
            'forestEastEntrance',
        ],
        exits: [
            {objectId: 'forestNorthEntrance'},
            {objectId: 'forestTowerEntrance', logic: hasBow},
            {objectId: 'forestEastEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'forestSecretEntrance',
        paths: [
            {nodeId: 'forest', logic: canRemoveLightStones},
        ],
        entranceIds: [
            'forestSecretEntrance',
        ],
        exits: [
            {objectId: 'forestSecretEntrance'},
        ],
    },
    {
        zoneId: 'treeCave',
        nodeId: 'forestSecretEntranceCave',
        entranceIds: [
            'forestSecretEntrance',
        ],
        exits: [
            {objectId: 'forestSecretEntrance'},
        ],
    },
    {
        zoneId: 'forestWater',
        nodeId: 'forestRiver',
        checks: [
            // This can be reached by diving under the water without iron boots.
            {objectId: 'forestRiverMoney', logic: hasIronBoots},
        ],
    },
    {
        zoneId,
        nodeId: 'treeVillage',
        checks: [
            // Including this here since it can be accessed from the village with no items.
            {objectId: 'forestPeachPiece'}
        ],
        paths: [
            {nodeId: 'forest'},
        ],
        entranceIds: [
            'elderEntrance',
            'northeastTreeEntrance',
            'southwestTreeEntrance',
            'southeastTreeEntrance',
        ],
        exits: [
            {objectId: 'elderEntrance'},
            {objectId: 'northeastTreeEntrance'},
            {objectId: 'southwestTreeEntrance'},
            {objectId: 'southeastTreeEntrance'},
            {objectId: 'treeVillageStoragePit'},
        ],
    },
    {
        zoneId,
        nodeId: 'treeVillageSpirit',
        paths: [
            {nodeId: 'forestTempleEastTreeEntrance', logic: canCrossCracks},
            {nodeId: 'forestTempleNortheastCaveEntrance'},
            {nodeId: 'forestTempleNorthwestTreeEntrance'},
            {nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
            // Ground in the SW corner will fall into the storage room.
            {nodeId: 'treeVillageStorageRoomSpirit'},
        ],
        entranceIds: [
            'elderSpiritEntrance',
            'northeastTreeEntranceSpirit',
            'southwestTreeEntranceSpirit',
            'southeastTreeEntranceSpirit',
        ],
        exits: [
            {objectId: 'elderSpiritEntrance'},
            {objectId: 'northeastTreeEntranceSpirit'},
            {objectId: 'southwestTreeEntranceSpirit'},
            {objectId: 'southeastTreeEntranceSpirit'},
        ],
    },
    {
        zoneId,
        nodeId: 'forestTempleEastTreeEntrance',
        paths: [
            {nodeId: 'forestTempleSouthwestCaveEntrance', logic: canCrossCracks},
            {nodeId: 'forestTempleNortheastCaveEntrance', logic: canCrossCracks},
            {nodeId: 'spiritForestWest', logic: canCrossCracks},
            {nodeId: 'treeVillageSpirit', logic: canCrossCracks},
            {nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
        entranceIds: [
            'forestTempleEastTreeEntrance',
            'forestTempleSoutheastLadder',
        ],
        exits: [
            {objectId: 'forestTempleEastTreeEntrance'},
            {objectId: 'forestTempleSoutheastLadder'},
        ],
    },
    {
        zoneId,
        nodeId: 'forestTempleSouthwestCaveEntrance',
        paths: [
            {nodeId: 'forestTempleEastTreeEntrance', logic: canCrossCracks},
            {nodeId: 'forestTempleBackDoor', logic: canCrossSpikeRiver},
            {nodeId: 'spiritForestWest', logic: canRemoveLightStones},
            {nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
        entranceIds: ['forestTempleSouthwestCaveEntrance'],
        exits: [{ objectId: 'forestTempleSouthwestCaveEntrance' }],
    },
    {
        zoneId,
        nodeId: 'forestTempleBackDoor',
        paths: [
            {nodeId: 'forestTempleSouthwestCaveEntrance', logic: canCrossSpikeRiver},
            {nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
        entranceIds: ['forestTempleBackDoor'],
        exits: [{ objectId: 'forestTempleBackDoor' }],
    },
    {
        zoneId,
        nodeId: 'spiritForestWest',
        checks: [
            {objectId: 'forestSpikesMoney', logic: canCrossSpikeRiver}
        ],
        paths: [
            // You can jump bypass the stones by jumping down from the cliff.
            {nodeId: 'forestTempleSouthwestCaveEntrance'},
            {nodeId: 'forestTempleNorthwestTreeEntrance'},
            {nodeId: 'forestTempleEastTreeEntrance', logic: canCrossCracks},
            {nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
    },
    {
        zoneId,
        nodeId: 'forestTempleNorthwestTreeEntrance',
        paths: [
            {nodeId: 'forestTempleNorthLadder', logic: canCross2Gaps},
            {nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
        entranceIds: ['forestTempleNorthwestTreeEntrance'],
        exits: [
            {objectId: 'forestTempleNorthwestTreeEntrance'},
            {objectId:'forestTempleBigKeyEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'forestTempleNorthLadder',
        paths: [
            {nodeId: 'forestTempleNorthwestTreeEntrance', logic: canCross2Gaps},
            {nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
        entranceIds: ['forestTempleNorthLadder'],
        exits: [{ objectId: 'forestTempleNorthLadder' }],
    },
    {
        zoneId,
        nodeId: 'forestTempleNortheastCaveEntrance',
        paths: [
            {nodeId: 'forestTempleNorthwestTreeEntrance', logic: canCross2Gaps},
            {nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
            // There is a hole in this section that will fall into this node.
            {nodeId: 'forestTemple2BeforeLock'},
        ],
        entranceIds: ['forestTempleNortheastCaveEntrance', 'forestTempleNortheastTreeEntrance'],
        exits: [
            { objectId: 'forestTempleNortheastCaveEntrance' },
            { objectId: 'forestTempleNortheastTreeEntrance' },
        ],
    },
    // Note that this node is unreachable from the rest of the forest, it can only be accessed
    // from the tower entrance.
    {
        zoneId,
        nodeId: 'forestTowerEntranceSpirit',
        checks: [
            {objectId: 'spiritForestGold'}
        ],
        paths: [
            {nodeId: 'forestTempleNorthwestTreeEntrance'},
            {nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
        entranceIds: ['forestTowerEntranceSpirit'],
        exits: [
            { objectId: 'forestTowerEntranceSpirit' },
        ],
    },
];

zoneId = 'treeVillage';
export const treeVillageNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'elderEntrance',
        entranceIds: [
            'elderEntrance',
            'elderDownstairs',
        ],
        exits: [
            { objectId: 'elderEntrance' },
            { objectId: 'elderDownstairs' },
        ],
    },
    {
        zoneId,
        nodeId: 'elderSpiritEntrance',
        entranceIds: [
            'elderSpiritEntrance',
            'elderSpiritStairs',
        ],
        exits: [
            { objectId: 'elderSpiritEntrance' },
            { objectId: 'elderSpiritStairs' },
        ],
    },
    {
        // tree village basement areas are actually part of the forestTemple zone.
        zoneId: 'forestTemple',
        nodeId: 'elderDownstairs',
        checks: [
            { objectId: 'elderPeachPiece', logic: hasMediumRange },
            { objectId: 'treeVillageBow', logic: hasCatEyes },
        ],
        entranceIds: [
            'elderUpstairs',
        ],
        exits: [
            { objectId: 'elderUpstairs' },
        ],
    },
    {
        // tree village basement areas are actually part of the forestTemple zone.
        zoneId: 'forestTemple',
        nodeId: 'elderSpiritDownstairs',
        paths: [
            {nodeId: 'forestTempleEntranceSpirit', logic: andLogic(hasMediumRange, canCross2Gaps)},
        ],
        entranceIds: [
            'elderSpiritStairs',
        ],
        exits: [
            {objectId: 'elderSpiritStairs'},
        ],
    },
    {
        zoneId,
        nodeId: 'northeastTreeEntrance',
        entranceIds: [
            'northeastTreeEntrance',
        ],
        exits: [
            { objectId: 'northeastTreeEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'northeastTreeEntranceSpirit',
        entranceIds: [
            'northeastTreeEntranceSpirit',
        ],
        exits: [
            { objectId: 'northeastTreeEntranceSpirit' },
        ],
    },
    {
        zoneId,
        nodeId: 'southwestTreeEntrance',
        entranceIds: [
            'southwestTreeEntrance',
        ],
        exits: [
            { objectId: 'southwestTreeEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'southwestTreeEntranceSpirit',
        entranceIds: [
            'southwestTreeEntranceSpirit',
        ],
        exits: [
            { objectId: 'southwestTreeEntranceSpirit' },
        ],
    },
    {
        zoneId,
        nodeId: 'southeastTreeEntrance',
        complexNpcs: [{
            dialogueKey: 'storageVanara',
            optionKey: 'peachReward',
            logic: {requiredFlags: ['clearedTreeVillageStorageRoom']},
        }],
        entranceIds: [
            'southeastTreeEntrance',
            'vanaraStorageStairs',
        ],
        exits: [
            { objectId: 'southeastTreeEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'southeastTreeEntranceSpirit',
        entranceIds: [
            'southeastTreeEntranceSpirit',
            'vanaraStorageStairsSpirit',
        ],
        exits: [
            {objectId: 'southeastTreeEntranceSpirit'},
            {objectId: 'vanaraStorageStairsSpirit'},
        ],
    },
    {
        // tree village basement areas are actually part of the forestTemple zone.
        zoneId: 'forestTemple',
        nodeId: 'treeVillageStorageRoom',
        checks: [
            {objectId: 'treeVillageMoneyA'},
            {objectId: 'treeVillageMoneyB'},
            {objectId: 'treeVillageEmptyChest'},
        ],
        flags: [{flag: 'clearedTreeVillageStorageRoom', logic: hasWeapon }],
        entranceIds: [
            'treeVillageStorageMarker',
        ],
        exits: [
            { objectId: 'vanaraStorageStairs' },
        ],
    },
    {
        // tree village basement areas are actually part of the forestTemple zone.
        zoneId: 'forestTemple',
        nodeId: 'treeVillageStorageRoomSpirit',
        entranceIds: [
            'vanaraStorageStairsSpirit',
        ],
        exits: [
            { objectId: 'vanaraStorageStairsSpirit', logic: hasWeapon },
        ],
    },
];
