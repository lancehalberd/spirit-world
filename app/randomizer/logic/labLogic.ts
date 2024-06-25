import {
    canDefeatFlameElemental, canDefeatFrostElemental, canDefeatStormElemental,
    andLogic,
} from 'app/content/logic';
const zoneId = 'lab';
export const labNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'labEntrance',
        checks: [{ objectId: 'labKey'}],
        paths: [{nodeId: 'labGrid', doorId: 'labLockedDoor'}],
        entranceIds: ['labEntrance'],
        exits: [
            {objectId: 'labEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'labGrid',
        paths: [
            // This door isn't locked when coming from the North.
            {nodeId: 'labEntrance'},
            // The result of this is you need any 2 of the 3 elements.
            {nodeId: 'labTree', logic: andLogic(canDefeatFlameElemental, canDefeatFrostElemental, canDefeatStormElemental)},
        ],
        entranceIds: [],
        exits: [],
    },
    {
        zoneId,
        nodeId: 'labTree',
        paths: [{nodeId: 'labGrid'}],
        entranceIds: ['treeEntrance'],
        exits: [
            {objectId: 'treeEntrance'},
        ],
    },
];
