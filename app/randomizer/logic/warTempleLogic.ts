import {
    andLogic,
    hasAstralProjection,
    hasBossWeapon,
    hasGloves, hasRoll,
    hasSpiritSight, hasWeapon,
} from 'app/content/logic';

import {LogicNode } from 'app/types';


const zoneId = 'warTemple';
export const warTempleNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'warTempleChestEntrance',
        checks: [
            {objectId: 'warTemple:0:0x2-empty-0'},
            {objectId: 'warTemple:0:0x2-gloves-0'},
            {objectId: 'warTemple:0:0x2-empty-1'},
        ],
        entranceIds: ['warTempleChestEntrance'],
        exits: [{objectId: 'warTempleChestEntrance'}],
    },
    {
        zoneId,
        nodeId: 'warTempleNorthEntrance',
        checks: [
            {objectId: 'warTemple:0:0x0-empty-0'},
            {objectId: 'warTemple:0:0x0-empty-1'},
            {objectId: 'warTemple:0:0x0-empty-2'},
        ],
        entranceIds: ['warTempleNorthEntrance'],
        exits: [{objectId: 'warTempleNorthEntrance'}],
    },
    {
        zoneId,
        nodeId: 'warTempleNorthEastEntrance',
        checks: [{objectId: 'warTemple:0:2x0-empty-0'}],
        paths: [
            {nodeId: 'warTempleEastEntrance', logic: hasWeapon},
        ],
        entranceIds: [
            'warTempleNorthEastEntrance',
        ],
        exits: [
            {objectId: 'warTempleNorthEastEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleEastEntrance',
        paths: [
            {nodeId: 'warTempleNorthEastEntrance'},
            {nodeId: 'warTempleKeyDoor'},
        ],
        entranceIds: [
            'warTempleEastEntrance',
        ],
        exits: [
            {objectId: 'warTempleEastEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleKeyDoor',
        checks: [{objectId: 'warTemple:0:2x2-bigKey-0'}],
        entranceIds: ['warTempleKeyDoor'],
        exits: [{objectId: 'warTempleKeyDoor'}],
    },
    {
        zoneId,
        nodeId: 'warTemplePitEntrance',
        checks: [{objectId: 'warTemple:0:2x2-peachOfImmortalityPiece-0'}],
        paths: [
            {nodeId: 'warTempleKeyDoor'},
        ],
        entranceIds: ['warTemplePitEntrance'],
    },
    {
        zoneId,
        nodeId: 'warTempleMainEntrance',
        paths: [
            {nodeId: 'warTempleKeyDoor'},
            {nodeId: 'warTemple:0:1x0-smallKey-0', logic: hasGloves},
        ],
        entranceIds: ['warTempleMainEntrance', 'warTempleLock1'],
        exits: [
            {objectId: 'warTempleMainEntrance'},
            {objectId: 'warTempleLock1'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTemple:0:1x0-smallKey-0',
        checks: [
            {objectId: 'warTemple:0:1x0-smallKey-0', logic: hasGloves},
            {objectId: 'warTemple:0:0x0-money-0', logic: hasWeapon},
            {objectId: 'warTemple:0:2x0-money-0', logic: hasWeapon},
        ],
        paths: [
            {nodeId: 'warTempleMainEntrance', logic: hasGloves},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleLock1',
        paths: [
            {nodeId: 'warTempleStairs2', logic: hasSpiritSight},
        ],
        entranceIds: ['warTempleLock1'],
        exits: [
            {objectId: 'warTempleLock1'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleMoneyMarker',
        checks: [
            {objectId: 'warTemple:1:0x0-money-0'}
        ],
        paths: [
            {nodeId: 'warTempleLock1'},
        ],
        entranceIds: ['warTempleMoneyMarker'],
    },
    {
        zoneId,
        nodeId: 'warTempleStairs2',
        paths: [
            {nodeId: 'warTempleLock1'},
        ],
        entranceIds: ['warTempleStairs2'],
        exits: [
            {objectId: 'warTempleStairs2'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTemple:2:0x0-pitEntrance-0',
        paths: [
            {nodeId: 'warTemple:2:0x0-pitEntrance-1', doorId: 'warTempleLock2'},
        ],
        entranceIds: ['warTempleStairs2'],
        exits: [
            {objectId: 'warTempleStairs2'},
            {objectId: 'warTemple:2:0x0-pitEntrance-0'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleKeyMarker',
        paths: [{nodeId: 'warTempleStairs2', logic: hasWeapon}],
        checks: [{objectId: 'warTemple:1:1x0-smallKey-0', logic: hasWeapon}],
        entranceIds: ['warTempleKeyMarker'],
    },
    {
        zoneId,
        nodeId: 'warTemple:2:0x0-pitEntrance-1',
        paths: [
            {nodeId: 'warTemple:2:0x0-pitEntrance-0', doorId: 'warTempleLock2'},
            {nodeId: 'warTempleBoss', doorId: 'warTempleBossDoor'},
        ],
        exits: [
            {objectId: 'warTemple:2:0x0-pitEntrance-1'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleBoss',
        checks: [
            {objectId: 'warTempleBoss', logic: andLogic(hasBossWeapon, hasRoll)},
            {objectId: 'warTemple:2:0x0-astralProjection-0', logic: andLogic(hasBossWeapon, hasRoll)},
        ],
        exits: [
            {objectId: 'warTempleExit', logic: hasAstralProjection},
        ],
    },
];
