import {
    andLogic,
    canAvoidBossAttacks,
    hasBossWeapon,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

const zoneId = 'tree';
export const treeNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'tree',
        entranceIds: ['treeEntrance'],
        exits: [
            {objectId: 'treeEntrance'},
            {objectId: 'voidEntrance'},
        ],
    },
];

export const voidNodes: LogicNode[] = [
    {
        zoneId: 'void',
        nodeId: 'tree',
        entranceIds: ['voidEntrance'],
        flags: [{flag: 'voidTree', logic: andLogic(hasBossWeapon, canAvoidBossAttacks) }],
        exits: [],
    },
];
