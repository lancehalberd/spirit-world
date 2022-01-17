import {
    hasCloudBoots,
    hasClone,
    hasIce,
    orLogic,
} from 'app/content/logic';

import {LogicNode } from 'app/types';

const zoneId = 'staffTower';
export const staffTowerNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'staffTowerEntrance',
        paths: [
            {nodeId: 'staffTowerEntranceUpstairs', logic: orLogic(hasIce, hasCloudBoots, hasClone)}
        ],
        entranceIds: ['staffTowerEntrance'],
        exits: [{objectId: 'staffTowerEntrance'}],
    },
    {
        zoneId,
        nodeId: 'staffTowerEntranceUpstairs',
        paths: [
            {nodeId: 'staffTowerEntrance'},
        ],
    },
];
