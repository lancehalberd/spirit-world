import {
    andLogic,
    hasFireBlessing,
    hasBossWeapon,
    hasRoll,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

// This logic does not appropriately support traversing the tower in reverse.
const zoneId = 'crater';
export const craterNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'craterEntrance',
        paths: [
            // Eventually this will also require the staff.
            {nodeId: 'craterLevel2', logic: hasBossWeapon},
        ],
        entranceIds: ['craterEntrance',],
        exits: [{objectId: 'craterEntrance'}],
    },
    {
        zoneId,
        nodeId: 'craterLevel2',
        checks: [{objectId: 'craterSmallMoney'}],
        paths: [
            // Eventually this will also require the staff.
            {nodeId: 'craterLevel3'},
        ],
        entranceIds: ['craterLockedDoor',],
        exits: [{objectId: 'craterLockedDoor'}],
    },
    {
        zoneId,
        nodeId: 'craterLevel3',
        checks: [
            {objectId: 'craterBigMoney'},
            {objectId: 'craterKey', logic: hasBossWeapon}
        ],
        paths: [
            // Eventually this will also require the staff.
            {nodeId: 'craterLevel3'},
        ],
        entranceIds: ['craterLowerDoor', 'craterEastDoor'],
        exits: [{objectId: 'craterLowerDoor'}, {objectId: 'craterEastDoor'}],
    },
    {
        zoneId,
        nodeId: 'craterCoolCave',
        checks: [{objectId: 'craterMiniBoss', logic: hasBossWeapon}],
        entranceIds: ['craterLockedDoor',],
        exits: [{objectId: 'craterLockedDoor'}],
    },
    {
        zoneId,
        nodeId: 'craterPassageUp',
        entranceIds: ['craterLowerDoor', 'craterUpperDoor'],
        exits: [
            {objectId: 'craterLowerDoor'},
            {objectId: 'craterUpperDoor', logic: hasFireBlessing },
        ],
    },
    {
        zoneId,
        nodeId: 'craterPeachPiece',
        checks: [{objectId: 'craterPeachPiece'}],
        entranceIds: ['craterUpperDoor'],
        exits: [
            {objectId: 'craterUpperDoor'},
        ],
    },
    {
        zoneId,
        nodeId: 'craterRiverCave',
        entranceIds: ['craterEastDoor', 'craterLavaDoor'],
        exits: [
            {objectId: 'craterEastDoor'},
            {objectId: 'craterLavaDoor', logic: hasFireBlessing},
        ],
    },
    // There are several inner rings, but they are all accessible only after `craterLavaDoor` is traversible.
    {
        zoneId,
        nodeId: 'craterBoss',
        checks: [{objectId: 'flameBeast', logic: andLogic(hasRoll, hasBossWeapon)}],
        entranceIds: ['craterLavaDoor'],
        exits: [
            {objectId: 'craterLavaDoor'},
        ],
    },
];
