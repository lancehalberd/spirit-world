import {
    andLogic,
    canPressHeavySwitches,
    canRemoveLightStones,
    hasFireBlessing,
    hasIce,
    hasInvisibility,
    hasBossWeapon,
    hasPhoenixCrown,
    hasRoll,
    hasSomersault,
    orLogic,
} from 'app/content/logic';


const lava1Drained = {requiredFlags: ['craterLava1']};
const lava2Drained = {requiredFlags: ['craterLava2']};
const canCrossLava = orLogic(hasSomersault, hasInvisibility, hasIce);

// This logic does not appropriately support traversing the tower in reverse.
const zoneId = 'crater';
export const craterNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'craterSecretEntrance',
        checks: [
            { objectId: 'craterSecret' },
        ],
        entranceIds: ['craterSecretEntrance'],
        exits: [{ objectId: 'craterSecretEntrance' }],
    },
    {
        zoneId,
        nodeId: 'craterEntrance',
        checks: [{objectId: 'craterMap'}],
        flags: [{flag: 'craterLava1', logic: andLogic(hasBossWeapon, canPressHeavySwitches)}],
        paths: [
            // The player must defeat a guardian and then press a heavy switch to drain the lava.
            {nodeId: 'craterLevel2', logic: lava1Drained },
            // There is now a path of cooled lava patches that you can safely roll across to the northern ledge.
            {nodeId: 'craterNorthLedge', logic: orLogic(hasRoll, canCrossLava)},
        ],
        entranceIds: ['craterEntrance', 'craterRightDoor'],
        exits: [{objectId: 'craterEntrance'}, {objectId: 'craterRightDoor'}],
    },
    {
        zoneId,
        nodeId: 'craterLevel2',
        checks: [{objectId: 'craterSilver'}],
        flags: [{flag: 'craterLava2', doorId: 'craterLava2'}],
        paths: [
            {nodeId: 'craterLevel3', logic: lava2Drained},
        ],
        entranceIds: ['craterLockedDoor', 'craterMidDoor', 'craterStairs'],
        exits: [{objectId: 'craterLockedDoor'}, {objectId: 'craterMidDoor'}, {objectId: 'craterStairs'}],
    },
    {
        zoneId,
        nodeId: 'craterLevel3',
        checks: [
            {objectId: 'craterBigMoney'},
            {objectId: 'craterKey2', logic: hasBossWeapon}
        ],
        paths: [],
        entranceIds: ['craterLowerDoor', 'craterEastDoor'],
        exits: [
            {objectId: 'craterLowerDoor', logic: lava2Drained},
            {objectId: 'craterEastDoor'},
        ],
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
        nodeId: 'craterWestPassage',
        entranceIds: ['craterLowerDoor', 'craterUpperDoor'],
        exits: [
            {objectId: 'craterLowerDoor'},
            {objectId: 'craterUpperDoor', logic: orLogic(hasFireBlessing, hasPhoenixCrown, hasInvisibility) },
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
        nodeId: 'craterMiddlePassage',
        entranceIds: ['craterMidDoor', 'craterInnerLeftDoor'],
        exits: [
            {objectId: 'craterMidDoor', logic: lava1Drained},
            {objectId: 'craterInnerLeftDoor'},
        ],
    },
    {
        zoneId,
        nodeId: 'craterNorthLedge',
        entranceIds: ['craterInnerLeftDoor', 'craterInnerRightDoor'],
        exits: [
            {objectId: 'craterInnerLeftDoor'},
            {objectId: 'craterInnerRightDoor'},
        ],
    },
    {
        zoneId,
        nodeId: 'craterEastPassageTop',
        checks: [{objectId: 'craterKey1'}],
        paths: [
            {nodeId: 'craterEastPassageBottom'},
        ],
        entranceIds: ['craterInnerRightDoor'],
        exits: [
            {objectId: 'craterInnerRightDoor'},
        ],
    },
    {
        zoneId,
        nodeId: 'craterEastPassageBottom',
        entranceIds: ['craterRightDoor'],
        exits: [
            {objectId: 'craterRightDoor'},
        ],
    },
    {
        zoneId,
        nodeId: 'createKeyPuzzle',
        checks: [{objectId: 'craterKey3', logic: andLogic(orLogic(hasFireBlessing, hasPhoenixCrown), canRemoveLightStones)}],
        entranceIds: ['craterStairs'],
        exits: [{objectId: 'craterStairs'}],
    },
    {
        zoneId,
        nodeId: 'craterRiverCaveTop',
        paths: [
            {nodeId: 'craterRiverCaveBottom', doorId: 'craterLava3', logic: orLogic(hasFireBlessing, hasPhoenixCrown, hasInvisibility)},
        ],
        entranceIds: ['craterEastDoor'],
        exits: [{objectId: 'craterEastDoor'}],
    },
    {
        zoneId,
        nodeId: 'craterRiverCaveBottom',
        paths: [
            {nodeId: 'craterRiverCaveTop', logic: orLogic(hasFireBlessing, hasPhoenixCrown, hasInvisibility)},
        ],
        entranceIds: ['craterLavaDoor'],
        exits: [
            {objectId: 'craterLavaDoor', logic: orLogic(hasFireBlessing, hasPhoenixCrown, hasInvisibility)},
        ],
    },
    {
        zoneId,
        nodeId: 'craterBoss',
        checks: [{objectId: 'flameBeast', logic: andLogic(canPressHeavySwitches, hasRoll, hasBossWeapon)}],
        entranceIds: ['craterLavaDoor'],
        exits: [
            {objectId: 'craterLavaDoor'},
        ],
    },
];
