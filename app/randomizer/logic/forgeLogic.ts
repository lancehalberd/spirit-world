import { LogicNode } from 'app/types';

// This logic does not appropriately support traversing the tower in reverse.
const zoneId = 'forge';
export const forgeNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'forgeEntrance',
        checks: [{objectId: 'forgeGloves'}, {objectId: 'forgeArmor'}],
        entranceIds: ['forgeEntrance'],
        exits: [
            {objectId: 'forgeEntrance'},
        ],
    },
];
