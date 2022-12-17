import {
    andLogic,
    orLogic,
    hasAstralProjection,
    hasSpiritSight,
    hasBossWeapon,
    hasSpiritBarrier,
    hasGloves,
    hasSomersault,
    hasTeleportation,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

const zoneId = 'cocoon';
export const cocoonNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'cocoonEntrance',
        paths: [
            {nodeId: 'cocoon4NW', logic: andLogic(hasSpiritSight, hasBossWeapon)},
            {nodeId: 'cocoon4NE', logic: andLogic(hasSpiritSight, hasBossWeapon)},
        ],
        entranceIds: ['cocoonEntrance'],
        exits: [{objectId: 'cocoonEntrance'}],
    },
    {
        zoneId,
        nodeId: 'cocoon4NW',
        entranceIds: ['cocoonLadderNW'],
        exits: [{objectId: 'cocoonLadderNW', logic: hasBossWeapon}],
    },
    {
        zoneId,
        nodeId: 'cocoon4NE',
        entranceIds: ['cocoonLadderNE', 'cocoonBigLock'],
        exits: [
            {objectId: 'cocoonLadderNE', logic: hasBossWeapon},
            {objectId: 'cocoonBigLock'},
        ],
    },
    {
        zoneId,
        nodeId: 'cocoon4SW',
        checks: [{objectId: 'cocoonSmallKey'}],
        paths: [{nodeId: 'cocoonEntrance', logic: hasSpiritSight}],
        exits: [{objectId: 'cocoonOpenDoor'}],
        entranceIds: ['cocoonOpenDoor'],
    },
    {
        zoneId,
        nodeId: 'cocoon4SE',
        checks: [{objectId: 'cocoonBigKey', logic: andLogic(hasAstralProjection, hasGloves)}],
        paths: [{nodeId: 'cocoonEntrance', logic: hasSpiritSight}],
        entranceIds: ['cocoonSealedLockedDoor'],
    },
    {
        zoneId,
        nodeId: 'cocoon3',
        paths: [
            {nodeId: 'cocoon3SW', logic: hasSpiritSight},
            {nodeId: 'cocoon3SE', logic: hasSpiritSight},
        ],
    },
    {
        zoneId,
        nodeId: 'cocoon3NW',
        paths: [{nodeId: 'cocoon3', logic: hasSpiritSight}],
        entranceIds: ['cocoonLadderNW'],
    },
    {
        zoneId,
        nodeId: 'cocoon3NE',
        checks: [{objectId: 'cocoonBigMoney', logic: andLogic(hasAstralProjection, hasGloves)}],
        paths: [{nodeId: 'cocoon3', logic: hasSpiritSight}],
        entranceIds: ['cocoonLadderNE'],
    },
    {
        zoneId,
        nodeId: 'cocoonBigChest',
        checks: [{objectId: 'cocoonBigChest'}],
        entranceIds: ['cocoonLadderBack', 'cocoonBigLock'],
        exits: [{objectId: 'cocoonLadderBack'}, {objectId: 'cocoonBigLock'}],
    },
    {
        zoneId,
        nodeId: 'cocoon3SW',
        paths: [{nodeId: 'cocoon3', logic: hasSpiritSight}],
        entranceIds: ['cocoonOpenDoor'],
        exits: [{objectId: 'cocoonOpenDoor'}]
    },
    {
        zoneId,
        nodeId: 'cocoon3SE',
        paths: [{nodeId: 'cocoon3', logic: hasSpiritSight}],
        entranceIds: ['cocoonLockedDoor'],
        exits: [{objectId: 'cocoonLockedDoor'}]
    },
    {
        zoneId,
        nodeId: 'cocoonBack',
        paths: [
            {nodeId: 'cocoonBoss', logic: andLogic(hasBossWeapon, hasSpiritSight, hasSpiritBarrier)},
        ],
        entranceIds: ['cocoonLadderBack'],
        exits: [{objectId: 'cocoonLadderBack'}],
    },
    {
        zoneId,
        nodeId: 'cocoonBoss',
        checks: [
            {objectId: 'cocoonBoss', logic: hasAstralProjection},
            {objectId: 'cocoonSilver', logic: orLogic(hasTeleportation, hasSomersault) },
        ],
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'cocoonGuardianPostBoss', lootType: 'teleportation'}},
        ],
    },
];
