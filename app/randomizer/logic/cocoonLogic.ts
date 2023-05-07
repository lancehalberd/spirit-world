import {
    andLogic,
    canCross2Gaps,
    canUseTeleporters,
    orLogic,
    hasAstralProjection,
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
            {nodeId: 'cocoon4NW', logic: andLogic(canUseTeleporters, hasBossWeapon)},
            {nodeId: 'cocoon4NE', logic: andLogic(canUseTeleporters, hasBossWeapon)},
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
        checks: [{objectId: 'cocoonSmallKey', logic: canCross2Gaps}],
        paths: [{nodeId: 'cocoonEntrance', logic: andLogic(canUseTeleporters, canCross2Gaps)}],
        exits: [{objectId: 'cocoonOpenDoor'}],
        entranceIds: ['cocoonOpenDoor'],
    },
    {
        zoneId,
        nodeId: 'cocoon4SE',
        checks: [{objectId: 'cocoonBigKey', logic: andLogic(hasAstralProjection, hasGloves)}],
        paths: [{nodeId: 'cocoonEntrance', logic: canUseTeleporters}],
        entranceIds: ['cocoonSealedLockedDoor'],
    },
    {
        zoneId,
        nodeId: 'cocoon3',
        paths: [
            {nodeId: 'cocoon3SW', logic: canUseTeleporters},
            {nodeId: 'cocoon3SE', logic: canUseTeleporters},
        ],
    },
    {
        zoneId,
        nodeId: 'cocoon3NW',
        paths: [{nodeId: 'cocoon3', logic: canUseTeleporters}],
        entranceIds: ['cocoonLadderNW'],
    },
    {
        zoneId,
        nodeId: 'cocoon3NE',
        checks: [{objectId: 'cocoonBigMoney', logic: andLogic(hasAstralProjection, hasGloves)}],
        paths: [{nodeId: 'cocoon3', logic: canUseTeleporters}],
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
        paths: [{nodeId: 'cocoon3', logic: canUseTeleporters}],
        entranceIds: ['cocoonOpenDoor'],
        exits: [{objectId: 'cocoonOpenDoor'}]
    },
    {
        zoneId,
        nodeId: 'cocoon3SE',
        checks: [{objectId: 'cocoonMap'}],
        paths: [{nodeId: 'cocoon3', logic: canUseTeleporters}],
        entranceIds: ['cocoonLockedDoor'],
        exits: [{objectId: 'cocoonLockedDoor'}]
    },
    {
        zoneId,
        nodeId: 'cocoonBack',
        paths: [
            {nodeId: 'cocoonBoss', logic: andLogic(hasBossWeapon, canUseTeleporters, hasSpiritBarrier)},
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
