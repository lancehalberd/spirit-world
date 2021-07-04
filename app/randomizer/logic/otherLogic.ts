import {
    hasIronBoots, hasGloves, hasMitts, hasTeleportation,
    hasMediumRange, hasSpiritSight, orLogic,
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
            { objectId: 'elderPeachPiece', logic: hasMediumRange },
            { objectId: 'treeVillage:1:0x0-bow-0' },
        ],
        entranceIds: [
            'elderDownstairs',
        ],
        exits: [
            { objectId: 'elderDownstairs' },
        ],
    },
];
