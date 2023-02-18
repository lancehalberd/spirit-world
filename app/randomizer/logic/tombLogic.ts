import {
    andLogic, orLogic,
    canCross2Gaps, hasSpiritSight, hasTrueSight,
    hasAstralProjection, hasClone, canBeatGolem, hasGloves, hasMediumRange,
    hasRangedPush, hasWeapon,
} from 'app/content/logic';

import {LogicNode} from 'app/types';

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
            {objectId: 'tombKey2', logic: orLogic(hasRangedPush, canCross2Gaps)},
            {objectId: 'tomb:1:1x0-roll-0'},
        ],
        paths: [
            // This path isn't necessary since we can just walk around
            // {nodeId: 'tombMiddleHallway', doorId: 'tombBigLock2'},
            {nodeId: 'tombMiddleHallway'},
            {nodeId: 'tombBeforeBigKey', doorId: 'tombLock2'},
            {nodeId: 'tombBigKey', doorId: 'tombBigLock3'},
            {nodeId: 'tombSilverRoom', logic: andLogic(hasMediumRange, orLogic(canCross2Gaps, hasGloves))},
        ],
        entranceIds: ['tombBasementEntrance'],
        exits: [{ objectId: 'tombBasementEntrance'}],
    },
    {
        zoneId,
        nodeId: 'tombBeforeBigKey',
        paths: [
            {nodeId: 'tombBigKey', logic: orLogic(hasMediumRange, hasClone)},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBigKey',
        checks: [{objectId: 'tombBigKey', logic: orLogic(hasMediumRange, hasClone)}],
        paths: [
            {nodeId: 'tombBigChest', doorId: 'tombBigLock3'},
        ],
    },
    {
        zoneId,
        nodeId: 'tombSilverRoom',
        checks: [{objectId: 'tombSilver', logic: hasWeapon}],
        paths: [
            {nodeId: 'tombBigChest', logic: orLogic(canCross2Gaps, hasGloves)},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBasementEntrance',
        paths: [
            {nodeId: 'beforeTombBoss', logic: orLogic(canCross2Gaps, hasGloves)},
        ],
        entranceIds: ['tombBasementEntrance'],
        exits: [{ objectId: 'tombBasementEntrance'}],
    },
    {
        zoneId,
        nodeId: 'beforeTombBoss',
        paths: [
            {nodeId: 'tombBasementEntrance', logic: orLogic(canCross2Gaps, hasGloves)},
            {nodeId: 'tombBoss', doorId: 'tombBossDoor'},
        ],
    },
    {
        zoneId,
        nodeId: 'tombBoss',
        checks: [
            {objectId: 'tombBoss', logic: canBeatGolem},
        ],
        paths: [{ nodeId: 'tombGuardian', logic: canBeatGolem}],
    },
    {
        zoneId,
        nodeId: 'tombGuardian',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'tomb:0:1x0-npc-0', lootType: 'spiritSight'}, progressFlags: ['tombTeleporter']},
        ],
        paths: [{ nodeId: 'tombCocoonEntrance', logic: hasGloves}],
        entranceIds: ['tombTeleporter'],
        exits: [
            {objectId: 'tombTeleporter', logic: orLogic(hasSpiritSight, hasTrueSight)},
        ],
    },
    {
        zoneId,
        nodeId: 'tombCocoonEntrance',
        entranceIds: ['tombExit'],
        exits: [{objectId: 'tombExit', logic: hasAstralProjection}],
    },
];
