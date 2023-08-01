import {
    andLogic,
    canAvoidBossAttacks,
    hasBossWeapon,
    canUseTeleporters,
} from 'app/content/logic';


const zoneId = 'tree';
export const treeNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'treeSpirit',
        paths: [{nodeId: 'tree', logic: canUseTeleporters}],
        entranceIds: ['treeEntrance'],
        exits: [
            {objectId: 'treeEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'tree',
        paths: [{nodeId: 'treeSpirit', logic: canUseTeleporters}],
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
