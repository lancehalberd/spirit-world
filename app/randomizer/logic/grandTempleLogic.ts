import { LogicNode } from 'app/types';

import {
    andLogic, orLogic, canHasTowerStaff,  canHitCrystalSwitches, canTravelFarUnderWater,
    hasDoubleClone, hasTripleShot,
    hasInvisibility, hasCloudBoots, hasMitts, hasClone, hasStaff, hasSomersault, hasTeleportation,
} from 'app/content/logic';

const zoneId = 'grandTemple';
export const grandTempleNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'grandTempleSecretEntrance',
        checks: [
            { objectId: 'templePeachPiece' },
        ],
        paths: [
            {nodeId: 'grandTempleWaterEntrance', logic: canTravelFarUnderWater},
        ],
        entranceIds: ['grandTempleSecretEntrance'],
        exits: [{ objectId: 'grandTempleSecretEntrance' }],
    },
    {
        zoneId,
        nodeId: 'grandTempleEntrance',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'generousPriest', lootType: 'money', lootAmount: 10}},
        ],
        paths: [
            {nodeId: 'grandTempleBigChest', logic: orLogic(hasClone, hasStaff)},
            {nodeId: 'grandTempleWaterEntrance', logic: canTravelFarUnderWater},
        ],
        entranceIds: ['grandTempleEntrance'],
        exits: [
            {objectId: 'grandTempleEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'grandTempleBigChest',
        checks: [{objectId: 'grandTempleBow'}],
        paths: [{nodeId: 'grandTempleBetweenKeyBlocks', doorId: 'grandTempleKeyBlockA'}],
        entranceIds: ['grandTempleLeftStairs', 'grandTempleStairs', 'grandTempleRightStairs'],
        exits: [
            {
                objectId: 'grandTempleLeftStairs',
                logic: orLogic(hasMitts, hasClone)
            },
            {
                objectId: 'grandTempleStairs',
                // Technically this can be done with two clones and the spirit cloak as well.
                logic: orLogic(hasTripleShot, andLogic(canHitCrystalSwitches, hasDoubleClone))
            },
            {
                objectId: 'grandTempleRightStairs',
                // There are many ways to climb this escalator...
                logic: orLogic(hasInvisibility, hasCloudBoots, hasSomersault, hasTeleportation, hasClone)
            },
        ],
    },
    {
        zoneId,
        nodeId: 'grandTempleBetweenKeyBlocks',
        paths: [{nodeId: 'grandTempleBigKey', doorId: 'grandTempleKeyBlockB'}],
    },
    {
        zoneId,
        nodeId: 'grandTempleBigKey',
        checks: [{objectId: 'grandTempleBigKey'}],
    },
    {
        zoneId,
        nodeId: 'grandTempleLeftRoom',
        checks: [
            {objectId: 'grandTempleLeftKey'},
            {objectId: 'grandTempleMoney', logic: hasStaff}
        ],
        entranceIds: ['grandTempleLeftStairs'],
        exits: [{ objectId: 'grandTempleLeftStairs' }],
    },
    {
        zoneId,
        nodeId: 'grandTempleRightRoom',
        checks: [
            {objectId: 'grandTempleRightKey'},
            {objectId: 'grandTempleGold', logic: orLogic(canHasTowerStaff, andLogic(hasClone, hasStaff))}
        ],
        entranceIds: ['grandTempleRightStairs'],
        exits: [{ objectId: 'grandTempleRightStairs' }],
    },
    {
        zoneId,
        nodeId: 'grandTempleMiddleRoom',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'grandPriest', lootType: 'ironSkin'}},
        ],
        entranceIds: ['grandTempleStairs'],
        exits: [{ objectId: 'grandTempleStairs' }],
    },
    {
        zoneId: 'grandTempleWater',
        nodeId: 'grandTempleWaterEntrance',
        paths: [
            {nodeId: 'grandTempleEntrance', logic: canTravelFarUnderWater},
            {nodeId: 'grandTempleSecretEntrance', logic: canTravelFarUnderWater},
        ],
        entranceIds: [
            'grandTempleWaterEntrance',
        ],
        exits: [
            { objectId: 'grandTempleWaterEntrance', logic: canTravelFarUnderWater },
        ],
    },
];
