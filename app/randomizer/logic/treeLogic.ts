import {
    andLogic,
    canAvoidBossAttacks,
    hasBossWeapon,
    hasSpiritSight,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

const zoneId = 'tree';
export const treeNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'treeSpirit',
        paths: [{nodeId: 'tree', logic: hasSpiritSight}],
        entranceIds: ['treeEntrance'],
        exits: [
            {objectId: 'treeEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'tree',
        paths: [{nodeId: 'treeSpirit', logic: hasSpiritSight}],
        exits: [
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
