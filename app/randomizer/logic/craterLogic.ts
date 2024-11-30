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
        paths: [
            // The player must defeat a guardian and then press a heavy switch to drain the lava.
            {nodeId: 'craterLevel2', logic: andLogic(hasBossWeapon, canPressHeavySwitches)},
            {nodeId: 'craterNorthLedge', logic: canCrossLava},
        ],
        entranceIds: ['craterEntrance', 'craterRightDoor'],
        exits: [{objectId: 'craterEntrance'}, {objectId: 'craterRightDoor'}],
    },
    {
        zoneId,
        nodeId: 'craterLevel2',
        checks: [{objectId: 'craterSilver'}],
        paths: [
            // Eventually this will also require the staff.
            {nodeId: 'craterLevel3', doorId: 'craterLava2'},
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
            {objectId: 'craterMidDoor'},
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
