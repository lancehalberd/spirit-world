import {
    andLogic, canCrossSmallGapsOrTeleport, orLogic,
    hasAstralProjection, hasBow, hasGloves, hasMediumRange,
    hasWeapon,
} from 'app/content/logic';

import {LogicNode } from 'app/types';

const zoneId = 'tomb';
export const tombNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'tombEntrance',
        checks: [
            {objectId: 'tombKey1', logic: hasWeapon},
            {objectId: 'tombMoney'},
        ],
        paths: [
            {nodeId: 'tombMiddleHallway', doorId: 'tombLock1'},
            {nodeId: 'tombMiddleHallway', logic: canCrossSmallGapsOrTeleport},
        ],
        entranceIds: ['tombEntrance'],
        exits: [{objectId: 'tombEntrance'}],
    },
    {
        zoneId,
        nodeId: 'tombMiddleHallway',
        paths: [
            {nodeId: 'tombBigChest', logic: hasWeapon},
            {nodeId: 'tombBigChest', doorId: 'tombBigLock2'},
            {nodeId: 'tombEntrance', doorId: 'tombLock1'},
            {nodeId: 'tombEntrance', logic: canCrossSmallGapsOrTeleport},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBigChest',
        checks: [
            {objectId: 'tombKey2', logic: hasWeapon},
            {objectId: 'tomb:1:1x0-roll-0'},
        ],
        paths: [
            // This path isn't necessary since we can just walk around
            // {nodeId: 'tombMiddleHallway', doorId: 'tombBigLock2'},
            {nodeId: 'tombMiddleHallway'},
            {nodeId: 'tombBeforeBigKey', doorId: 'tombLock2'},
            {nodeId: 'tombBigKey', doorId: 'tombBigLock3'},
            {nodeId: 'tombPeachPiece', logic: andLogic(hasBow, orLogic(canCrossSmallGapsOrTeleport, hasGloves))},
        ],
        entranceIds: ['tombBasementEntrance'],
        exits: [{ objectId: 'tombBasementEntrance'}],
    },
    {
        zoneId,
        nodeId: 'tombBeforeBigKey',
        paths: [
            {nodeId: 'tombBigKey', logic: hasMediumRange},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBigKey',
        checks: [{objectId: 'tombBigKey', logic: hasMediumRange}],
        paths: [
            {nodeId: 'tombBigChest', doorId: 'tombBigLock3'},
        ],
    },
    {
        zoneId,
        nodeId: 'tombPeachPiece',
        checks: [{objectId: 'tomb:1:0x0-peachOfImmortalityPiece-0', logic: hasWeapon}],
        paths: [
            {nodeId: 'tombBigChest', logic: orLogic(canCrossSmallGapsOrTeleport, hasGloves)},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBasementEntrance',
        paths: [
            {nodeId: 'beforeTombBoss', logic: canCrossSmallGapsOrTeleport},
        ],
        entranceIds: ['tombBasementEntrance'],
        exits: [{ objectId: 'tombBasementEntrance'}],
    },
    {
        zoneId,
        nodeId: 'beforeTombBoss',
        paths: [
            {nodeId: 'tombBasementEntrance', logic: canCrossSmallGapsOrTeleport},
            {nodeId: 'tombBoss', doorId: 'tombBossDoor'},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBoss',
        checks: [
            {objectId: 'tomb:0:1x1-beetleBoss-0', logic: hasWeapon},
        ],
        paths: [{ nodeId: 'tombExit', logic: hasWeapon}],
    },
    {
        zoneId,
        nodeId: 'tombExit',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'tomb:0:1x0-npc-0', lootType: 'spiritSight'}, progressFlags: ['tombTeleporter']},
        ],
        entranceIds: ['tombExit', 'tombTeleporter'],
        exits: [
            {objectId: 'tombExit', logic: hasAstralProjection},
            {objectId: 'tombTeleporter', logic: hasAstralProjection},
        ],
    },
];
