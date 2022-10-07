import { LogicNode } from 'app/types';

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
