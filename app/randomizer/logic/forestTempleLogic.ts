import {
    andLogic,
    hasBossWeapon,
    canAvoidBossAttacks,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

// This logic does not appropriately support traversing the tower in reverse.
const zoneId = 'forestTemple';
export const forestTempleNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'forestTempleFirstArea',
        paths: [
            {nodeId: 'forestTempleAfterLock', doorId: 'forestTempleLockedDoor'},
        ],
        entranceIds: ['forestTempleLadder1', 'forestTempleLadder2'],
        exits: [
            {objectId: 'forestTempleLadder1'},
            {objectId: 'forestTempleLadder2', logic: hasBossWeapon}
        ],
    },
    {
        zoneId,
        nodeId: 'forestTempleBeforeLock',
        checks: [{objectId: 'forestTempleSmallKey'}],
        paths: [
            {nodeId: 'forestTempleAfterLock', doorId: 'forestTempleLockedDoor'},
        ],
        entranceIds: ['forestTempleLadder3'],
        exits: [{objectId: 'forestTempleLadder3'}],
    },
    {
        zoneId,
        nodeId: 'forestTempleAfterLock',
        paths: [
            {nodeId: 'forestTempleBeforeLock', doorId: 'forestTempleLockedDoor'},
        ],
        entranceIds: ['forestTempleLadder4'],
        exits: [{objectId: 'forestTempleLadder4'}],
    },
    {
        zoneId,
        nodeId: 'forestTempleBigKey',
        checks: [{objectId: 'forestTempleBigKey'}],
        paths: [
            {nodeId: 'forestTempleBigChest', doorId: 'forestTempleBigDoor'},
        ],
        entranceIds: ['forestTempleLadder5'],
        exits: [{objectId: 'forestTempleLadder5'}],
    },
    {
        zoneId,
        nodeId: 'forestTempleBigChest',
        checks: [{objectId: 'forestTempleBigChest'}],
        paths: [
            {nodeId: 'forestTempleBigKey', doorId: 'forestTempleBigDoor'},
        ],
    },
    {
        zoneId,
        nodeId: 'forestTempleBack',
        entranceIds: ['forestTempleBackDoor'],
        paths: [{nodeId: 'forestTempleBoss', doorId: 'forestTempleBossDoor'}],
    },
    {
        zoneId,
        nodeId: 'forestTempleBoss',
        checks: [{objectId: 'forestTempleBoss', logic: andLogic(hasBossWeapon, canAvoidBossAttacks)}],
    },
];
