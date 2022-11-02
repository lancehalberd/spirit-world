import { LogicNode } from 'app/types';

const zoneId = 'tree';
export const treeNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'tree',
        entranceIds: ['treeEntrance'],
        exits: [
            {objectId: 'treeEntrance'},
        ],
    },
];
