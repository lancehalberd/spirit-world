import {
    andLogic, canCross2Gaps, canHasTowerStaff, hasClone,
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
        nodeId: 'waterfallCaveEntrance',
        entranceIds: [
            'waterfallCaveEntrance',
            'waterfallCaveLeftMain', 'waterfallCaveRightMain',
            'waterfallCaveLeft', 'waterfallCaveRight',
            'waterfallCaveBackLeft', 'waterfallCaveBackRight',
        ],
        exits: [
            { objectId: 'waterfallCaveEntrance' },
            { objectId: 'waterfallCaveLeftMain' },
            { objectId: 'waterfallCaveRightMain' },
            { objectId: 'waterfallCaveBackLeft' },
            { objectId: 'waterfallCaveBackRight' },
            { objectId: 'waterfallCaveLeft' },
            { objectId: 'waterfallCaveRight' },

        ],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveBackLeft',
        checks: [
            { objectId: 'waterfallCaveBigMoney' },
            { objectId: 'waterfallCaveLittleMoney'} ,
        ],
        entranceIds: ['waterfallCaveBackLeft'],
        exits: [{ objectId: 'waterfallCaveBackLeft' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveBackRight',
        entranceIds: ['waterfallCaveBackRight'],
        exits: [{ objectId: 'waterfallCaveBackRight' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveLeft',
        checks: [{ objectId: 'waterfallCaveEmptyChest' }],
        entranceIds: ['waterfallCaveLeft'],
        exits: [{ objectId: 'waterfallCaveLeft' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveRight',
        checks: [{ objectId: 'waterfallCaveBiggerMoney' }],
        entranceIds: ['waterfallCaveRight'],
        exits: [{ objectId: 'waterfallCaveRight' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveMain',
        entranceIds: ['waterfallCaveLeftMain', 'waterfallCaveRightMain'],
        exits: [{ objectId: 'waterfallCaveLeftMain' }, { objectId: 'waterfallCaveRightMain' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveTop',
        checks: [{ objectId: 'waterfallCavePeachPiece' }],
        paths: [{ nodeId:'waterfallCaveEntrance' }],
        entranceIds: ['waterfallCaveMarker'],
    }
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

    // Clone Cave
    {
        zoneId: 'cloneCave',
        nodeId: 'cloneCaveEntrance',
        checks: [{objectId: 'cloneCaveMoney', logic: hasClone}],
        paths: [{ nodeId: 'cloneCaveExit'}],
        entranceIds: ['cloneCaveEntrance'],
        exits: [
            { objectId: 'cloneCaveEntrance' },
        ],
    },
    {
        zoneId: 'cloneCave',
        nodeId: 'cloneCaveExit',
        entranceIds: ['cloneCaveExit'],
        exits: [
            { objectId: 'cloneCaveExit' },
        ],
    },

    // Hype Cave
    {
        zoneId: 'hypeCave',
        nodeId: 'hypeCave',
        checks: [
            {objectId: 'hypeCave:s0:0x0-money-1'},
            {objectId: 'hypeCave:s0:0x0-money-2'},
            {objectId: 'hypeCave:s0:0x0-money-3'},
            {objectId: 'hypeCave:s0:0x0-money-4'},
            {objectId: 'hypeCave:s0:0x0-money-0', logic: orLogic(hasSomersault, canHasTowerStaff)},
        ],
        entranceIds: ['hypeCaveEntrance'],
        exits: [
            { objectId: 'hypeCaveEntrance' },
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

    // Jade city
    {
        zoneId: 'holyCityInterior',
        nodeId: 'jadeCitySoutheastHouse',
        checks: [{objectId: 'jadeCityPeachPiece'}],
        entranceIds: ['jadeCitySoutheastDoor'],
        exits: [{ objectId: 'jadeCitySoutheastDoor'}],
    },
];
