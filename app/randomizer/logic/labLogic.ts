
const zoneId = 'lab';
export const labNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'lab',
        entranceIds: ['labEntrance', 'treeEntrance'],
        exits: [
            {objectId: 'labEntrance'},
            {objectId: 'treeEntrance'},
        ],
    },
];
