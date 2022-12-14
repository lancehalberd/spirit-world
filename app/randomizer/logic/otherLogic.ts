import {
    andLogic, canCross2Gaps,
    hasBossWeapon, hasWeapon, hasCatEyes, hasFireBlessing, hasInvisibility,
    hasMediumRange, hasMitts, hasSomersault, hasTeleportation,
    orLogic,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

export const treeVillageNodes: LogicNode[] = [
    {
        zoneId: 'treeVillage',
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
        zoneId: 'treeVillage',
        nodeId: 'elderDownstairs',
        checks: [
            { objectId: 'elderPeachPiece', logic: orLogic(hasMediumRange,
                orLogic(hasSomersault, hasTeleportation)) },
            { objectId: 'treeVillage:1:0x0-bow-0', logic: hasCatEyes },
        ],
        entranceIds: [
            'elderUpstairs',
        ],
        exits: [
            { objectId: 'elderUpstairs' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'northwestTree',
        entranceIds: [
            'northwestTreeEntrance',
        ],
        exits: [
            { objectId: 'northwestTreeEntrance' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'northeastTreeEntrance',
        entranceIds: [
            'northeastTreeEntrance',
        ],
        exits: [
            { objectId: 'northeastTreeEntrance' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'southeastTree',
        complexNpcs: [{dialogueKey: 'storageVanara', optionKey: 'peachReward'},],
        entranceIds: [
            'southeastTreeEntrance',
            'vanaraStorageStairs',
        ],
        exits: [
            { objectId: 'southeastTreeEntrance' },
        ],
    },
    {
        zoneId: 'treeVillage',
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
        zoneId: 'treeVillage',
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
        zoneId: 'treeVillage',
        nodeId: 'elderSpiritDownstairs',
        entranceIds: [
            'elderSpiritStairs',
            'forestTempleBackDoor',
        ],
        exits: [
            { objectId: 'elderSpiritStairs' },
            { objectId: 'forestTempleBackDoor', logic: andLogic(hasMediumRange, canCross2Gaps) }
        ],
    },
];

export const waterfallCaveNodes: LogicNode[] = [
    {
        zoneId: 'waterfallCave',
        nodeId: 'elderEntrance',
        checks: [
            { objectId: 'waterfallCaveBigMoney' },
            { objectId: 'waterfallCaveLittleMoney'} ,
        ],
        entranceIds: ['waterfallCaveEntrance'],
        exits: [{ objectId: 'waterfallCaveEntrance' }],
    },
];

// The flameBeast flag is set correctly during simulation, so this logic works as expected.
const canAscendToCrater = orLogic(hasMitts, hasInvisibility, {requiredFlags: ['flameBeast']});
const canAscendToCraterSpirit = orLogic(hasInvisibility, hasFireBlessing, {requiredFlags: ['flameBeast']});
export const cavesNodes: LogicNode[] = [
    // This cave connects the NW corner of the overworld to the sky and is one way.
    // It is filled with lava while the fire beast is active.
    {
        zoneId: 'caves',
        nodeId: 'noToolCave',
        checks: [
            { objectId: 'caves:0:1x0-money-0'},
        ],
        entranceIds: ['caves:noToolSideArea'],
        exits: [
            { objectId: 'caves:noToolSideArea'},
        ],
    },
    {
        zoneId: 'caves',
        nodeId: 'ascentCaveBottom',
        paths: [
            {nodeId: 'ascentCaveTop', logic: canAscendToCrater },
        ],
        entranceIds: ['caves-ascentEntrance'],
        exits: [
            { objectId: 'caves-ascentEntrance'}
        ],
    },
    {
        zoneId: 'caves',
        nodeId: 'ascentCaveTop',
        paths: [
            {nodeId: 'ascentCaveBottom', logic: canAscendToCrater },
        ],
        checks: [
            { objectId: 'caves-ascentPeachPiece', logic: canCross2Gaps},
        ],
        entranceIds: ['caves-ascentExit'],
        exits: [
            { objectId: 'caves-ascentExit' },
        ],
    },
    {
        zoneId: 'caves',
        nodeId: 'ascentCavesSpirit',
        entranceIds: ['caves-ascentEntranceSpirit', 'caves-ascentExitSpirit'],
        exits: [
            { objectId: 'caves-ascentExitSpirit', logic:canAscendToCraterSpirit },
            { objectId: 'caves-ascentEntranceSpirit'}
        ],
    },

    // Fertility Temple
    {
        zoneId: 'caves',
        nodeId: 'normalFertilityTemple',
        entranceIds: ['fertilityTempleEntrance'],
        exits: [
            { objectId: 'fertilityTempleEntrance' },
        ],
    },
    {
        zoneId: 'caves',
        nodeId: 'spiritFertilityTemple',
        entranceIds: ['fertilityTempleSpiritEntrance', 'fertilityTempleExit'],
        exits: [
            { objectId: 'fertilityTempleSpiritEntrance' },
            { objectId: 'fertilityTempleExit' },
        ],
    },

    // Lake Tunnel
    {
        zoneId: 'lakeTunnel',
        nodeId: 'lakeTunnelFront',
        paths: [{ nodeId: 'lakeTunnelBack', logic: andLogic(orLogic(hasSomersault, hasTeleportation), hasBossWeapon)}],
        entranceIds: ['lakeTunnelEntrance'],
        exits: [
            { objectId: 'lakeTunnelEntrance' },
        ],
    },
    {
        zoneId: 'lakeTunnel',
        nodeId: 'lakeTunnelBack',
        paths: [{ nodeId: 'lakeTunnelFront', logic: andLogic(orLogic(hasSomersault, hasTeleportation), hasBossWeapon)}],
        entranceIds: ['helixEntrance'],
        exits: [
            { objectId: 'helixEntrance' },
        ],
    },
];


export const holyCityNodes: LogicNode[] = [
    {
        zoneId: 'holyCityInterior',
        nodeId: 'moneyMaze',
        checks: [
            { objectId: 'moneyMazePeachPiece' },
        ],
        entranceIds: ['moneyMazeEntrance'],
        exits: [{ objectId: 'moneyMazeEntrance' }],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'kitchen',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'meanPerson', lootType: 'money', lootAmount: 1}},
        ],
        entranceIds: ['foodHouse'],
        exits: [{ objectId: 'foodHouse' }],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'bridgeHouse',
        entranceIds: ['bridgeHouse'],
        exits: [{ objectId: 'bridgeHouse'}],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'gardenHouse',
        entranceIds: ['gardenHouse'],
        exits: [{ objectId: 'gardenHouse'}],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'holyCityClothesHouse',
        entranceIds: ['clothesHouse'],
        exits: [{ objectId: 'clothesHouse'}],
    },
];

