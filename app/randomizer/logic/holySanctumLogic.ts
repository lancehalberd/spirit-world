
import {
    andLogic, canCross2Gaps, hasCharge, hasUpgradedBow,
    hasAstralProjection, hasCatEyes, hasWaterBlessing, canUseTeleporters, hasFireBlessing,
    hasLightning, hasMediumRange, hasFire, hasSpiritBarrier, hasIce,
    hasClone, hasStaff, hasWeapon, canBeatGolem, canBeatIdols,
} from 'app/content/logic';

const zoneId = 'holySanctum';
export const holySanctumNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'holySanctumEntrance',
        paths: [
            {nodeId: 'holySanctumBack', doorId: 'holySanctumBackDoor'},
        ],
        entranceIds: [
            'holySanctumEntrance', 'holySanctumTowerStairs',
            'fireSanctumEntrance', 'fireSanctumExit',
            'lightningSanctumEntrance', 'lightningSanctumExit',
            'iceSanctumEntrance', 'iceSanctumExit',
        ],
        exits: [
            {objectId: 'holySanctumEntrance'},
            {objectId: 'holySanctumTowerStairs'},
            {objectId: 'fireSanctumEntrance', logic: andLogic(hasFire, hasSpiritBarrier)},
            {objectId: 'lightningSanctumEntrance', logic: andLogic(hasLightning, hasMediumRange)},
            {objectId: 'iceSanctumEntrance', logic: andLogic(hasIce, hasMediumRange, hasClone)},
        ],
    },
    {
        zoneId,
        nodeId: 'holySanctumBack',
        checks: [{objectId: 'holySanctumBigKey'}],
        paths: [
            {nodeId: 'holySanctumEntrance'},
            {nodeId: 'holySanctumAfterKeyBlock', doorId: 'holySanctumKeyBlock'}
        ],
    },
    {
        zoneId,
        nodeId: 'holySanctumAfterKeyBlock',
        paths: [
            {nodeId: 'holySanctumBack', doorId: 'holySanctumKeyBlock'}
        ],
        entranceIds: ['holySanctumBackEntrance'],
        exits: [{ objectId: 'holySanctumBackEntrance'}],
    },
    {
        zoneId: 'holySanctumBack',
        nodeId: 'holySanctumArrowPuzzle',
        paths: [
            {nodeId: 'holySanctumGolem', logic: andLogic(hasCharge, hasUpgradedBow)}
        ],
        entranceIds: ['holySanctumBackEntrance'],
        exits: [{ objectId: 'holySanctumBackEntrance'}],
    },
    {
        zoneId: 'holySanctumBack',
        nodeId: 'holySanctumGolem',
        checks: [{objectId: 'holySanctumGolem', logic: canBeatGolem}],
        paths: [
            {nodeId: 'holySanctumArrowPuzzle', logic: canBeatGolem}
        ],
        entranceIds: ['holySanctumBackStairsA'],
        exits: [{ objectId: 'holySanctumBackStairsA', logic: canBeatGolem}],
    },
    {
        zoneId: 'holySanctumBack',
        nodeId: 'holySanctumIdols',
        checks: [{objectId: 'holySanctumIdols', logic: canBeatIdols}],
        entranceIds: ['holySanctumBackStairsA', 'holySanctumBackStairsB'],
        exits: [
            { objectId: 'holySanctumBackStairsA', logic: canBeatIdols},
            { objectId: 'holySanctumBackStairsB', logic: canBeatIdols}],
    },
    {
        zoneId: 'holySanctumBack',
        nodeId: 'holySanctumPhoenixCrown',
        checks: [{objectId: 'holySanctumPhoenixCrown'}],
        entranceIds: ['holySanctumBackStairsB'],
        exits: [{ objectId: 'holySanctumBackStairsB'}],
    },
    {
        zoneId,
        nodeId: 'holySanctumTower',
        checks: [{objectId: 'holySanctumBow'}],
        entranceIds: ['holySanctumTowerStairs'],
        exits: [{ objectId: 'holySanctumTowerStairs'}],
    },
    {
        zoneId: 'fireSanctum',
        nodeId: 'fireSanctumEntrance',
        paths: [
            {nodeId: 'fireSanctumBack', logic: andLogic(hasFire, hasMediumRange, hasFireBlessing)},
        ],
        entranceIds: ['fireSanctumEntrance'],
        exits: [
            {objectId: 'fireSanctumEntrance'},
        ],
    },
    {
        zoneId: 'fireSanctum',
        nodeId: 'fireSanctumBack',
        checks: [
            {objectId: 'fireSanctumKey', logic: hasFireBlessing},
            {objectId: 'fireSanctumPeachPiece', logic: andLogic(canUseTeleporters, hasFireBlessing, hasAstralProjection)},
        ],
        exits: [
            {objectId: 'fireSanctumExit'},
        ],
    },
    {
        zoneId: 'lightningSanctum',
        nodeId: 'lightningSanctumEntrance',
        // This puzzle is much easier with the tower staff, but it can be solved with just the staff.
        paths: [{nodeId: 'lightningSanctumBack', logic: hasStaff}],
        entranceIds: ['lightningSanctumEntrance'],
        exits: [
            {objectId: 'lightningSanctumEntrance'},
        ],
    },
    {
        zoneId: 'lightningSanctum',
        nodeId: 'lightningSanctumBack',
        checks: [
            {objectId: 'lightningSanctumKey', logic: canCross2Gaps},
            {objectId: 'lightningSanctumPeachPiece', logic: andLogic(hasStaff, canUseTeleporters)},
        ],
        exits: [
            {objectId: 'lightningSanctumExit', logic: canCross2Gaps},
        ],
    },
    {
        zoneId: 'iceSanctum',
        nodeId: 'iceSanctumEntrance',
        paths: [{nodeId: 'iceSanctumWaterArea', logic: andLogic(hasCatEyes, hasWaterBlessing, canUseTeleporters)}],
        entranceIds: ['iceSanctumEntrance'],
        exits: [
            {objectId: 'iceSanctumEntrance'},
        ],
    },
    {
        zoneId: 'iceSanctum',
        nodeId: 'iceSanctumWaterArea',
        paths: [{nodeId: 'iceSanctumBack', logic: andLogic(hasIce, hasMediumRange, canUseTeleporters)}],
    },
    {
        zoneId: 'iceSanctum',
        nodeId: 'iceSanctumBack',
        checks: [{objectId: 'iceSanctumKey'}, {objectId: 'iceSanctumPeachPiece', logic: hasWeapon}],
        exits: [
            {objectId: 'iceSanctumExit'},
        ],
    },
];
