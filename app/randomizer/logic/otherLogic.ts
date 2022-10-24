import {
    andLogic, canCross2Gaps,
    hasBossWeapon, hasCatEyes, hasFireBlessing, hasInvisibility,
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
        entranceIds: ['caves-ascentEntranceSpirit'],
        exits: [
            { objectId: 'caves-ascentExitSpirit', logic:canAscendToCraterSpirit },
            { objectId: 'caves-ascentEntranceSpirit'}
        ],
    },
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
        nodeId: 'templePeachPiece',
        checks: [
            { objectId: 'templePeachPiece' },
        ],
        entranceIds: ['templeCrackedDoor'],
        exits: [{ objectId: 'templeCrackedDoor' }],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'templeMain',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'generousPriest', lootType: 'money', lootAmount: 10}},
        ],
        entranceIds: ['templeDoor'],
        exits: [{ objectId: 'templeDoor' }],
    },
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
];

