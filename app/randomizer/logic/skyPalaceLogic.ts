import { LogicNode } from 'app/types';

const zoneId = 'skyPalace';
export const skyPalaceNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'skyPalaceEntrance',
        checks: [{objectId: 'skyPalaceRoll'}, {objectId: 'skyPalaceCloud'}],
        entranceIds: ['skyPalaceEntrance'],
        exits: [
            {objectId: 'skyPalaceEntrance'},
        ],
    },
];
