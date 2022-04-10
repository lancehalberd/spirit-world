import {
    andLogic, orLogic,
    canCross2Gaps,
    hasAstralProjection, hasSpiritSight, hasBossWeapon, hasGloves, hasMediumRange,
    hasRangedPush, hasWeapon, hasRoll,
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
            {nodeId: 'tombMiddleHallway', logic: canCross2Gaps},
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
            {nodeId: 'tombEntrance', logic: canCross2Gaps},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBigChest',
        checks: [
            {objectId: 'tombKey2', logic: hasRangedPush},
            {objectId: 'tomb:1:1x0-roll-0'},
        ],
        paths: [
            // This path isn't necessary since we can just walk around
            // {nodeId: 'tombMiddleHallway', doorId: 'tombBigLock2'},
            {nodeId: 'tombMiddleHallway'},
            {nodeId: 'tombBeforeBigKey', doorId: 'tombLock2'},
            {nodeId: 'tombBigKey', doorId: 'tombBigLock3'},
            {nodeId: 'tombPeachPiece', logic: andLogic(hasMediumRange, orLogic(canCross2Gaps, hasGloves))},
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
            {nodeId: 'tombBigChest', logic: orLogic(canCross2Gaps, hasGloves)},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBasementEntrance',
        paths: [
            {nodeId: 'beforeTombBoss', logic: canCross2Gaps},
        ],
        entranceIds: ['tombBasementEntrance'],
        exits: [{ objectId: 'tombBasementEntrance'}],
    },
    {
        zoneId,
        nodeId: 'beforeTombBoss',
        paths: [
            {nodeId: 'tombBasementEntrance', logic: canCross2Gaps},
            {nodeId: 'tombBoss', doorId: 'tombBossDoor'},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBoss',
        // Boss has attacks that require roll to dodge.
        checks: [
            {objectId: 'tombBoss', logic: andLogic(hasBossWeapon, hasRoll)},
        ],
        paths: [{ nodeId: 'tombExit', logic: andLogic(hasBossWeapon, hasRoll)}],
    },
    {
        zoneId,
        nodeId: 'tombExit',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'tomb:0:1x0-npc-0', lootType: 'spiritSight'}, progressFlags: ['tombTeleporter']},
        ],
        entranceIds: ['tombExit', 'tombTeleporter'],
        exits: [
            {objectId: 'tombExit', logic: andLogic(hasAstralProjection, hasGloves)},
            {objectId: 'tombTeleporter', logic: hasSpiritSight},
        ],
    },
];
