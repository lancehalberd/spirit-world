import {
    andLogic, canCross2Gaps,
    hasCatEyes, hasMediumRange, hasMitts, hasIce, hasTeleportation,
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
            { objectId: 'elderPeachPiece', logic: orLogic(hasMediumRange, hasTeleportation) },
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

const canAscendToCrater = orLogic(hasMitts, hasIce, {requiredFlags: ['flameBeast']});
export const cavesNodes: LogicNode[] = [
    // This cave connects the NW corner of the overworld to the sky and is one way.
    // It is filled with lava while the fire beast is active.
    {
        zoneId: 'caves',
        nodeId: 'ascentCaves',
        checks: [
            { objectId: 'caves-ascentPeachPiece', logic: canAscendToCrater},
        ],
        entranceIds: ['caves-ascentEntrance'],
        exits: [
            { objectId: 'caves-ascentExit', logic:canAscendToCrater },
            { objectId: 'caves-ascentEntrance'}
        ],
    },
];
