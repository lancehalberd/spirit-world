import {
    andLogic, canCross2Gaps, canCross4Gaps, canDefeatBalloonMegapede,
    hasBossWeapon, hasIce, hasInvisibility, hasMitts, orLogic,
} from 'app/content/logic';



const drainedLava1 = {requiredFlags: ['forgeLava1']};
const drainedLava2 = {requiredFlags: ['forgeLava2']};
const drainedLava3 = {requiredFlags: ['forgeLava3']};
const drainedLava4 = {requiredFlags: ['forgeLava4']};

const zoneId = 'forge';
export const forgeNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'forgeEntrance',
        checks: [{objectId: 'forgeSmallMoney', logic: drainedLava1}],
        paths: [{nodeId: 'forgeEntranceMaterial'}],
        entranceIds: ['forgeEntrance', 'forgeStairs1', 'forgeShortcut'],
        exits: [
            {objectId: 'forgeEntrance'},
            {objectId: 'forgeStairs1', logic: drainedLava1},
        ],
    },
    {
        zoneId,
        nodeId: 'forgeEntranceMaterial',
        flags: [{flag: 'forgeLava1', logic: hasBossWeapon}],
        paths: [{nodeId: 'forgeEntrance'}],
    },
    {
        zoneId,
        nodeId: 'forgeB1',
        checks: [
            {objectId: 'forgeMap', logic: andLogic(drainedLava2)},
            {objectId: 'forgeGloves', logic: andLogic(drainedLava2)},
            {objectId: 'forgeBigKey', logic: andLogic(drainedLava2, drainedLava3)},
        ],
        paths: [{nodeId: 'forgeB1Material', logic: orLogic(canCross2Gaps, hasIce, hasInvisibility) }],
        entranceIds: ['forgeStairs1', 'forgeStairs2'],
        exits: [
            {objectId: 'forgeStairs2', logic: orLogic(canCross2Gaps, hasIce, hasInvisibility)},
            {objectId: 'forgeStairs1', logic: drainedLava1},
        ],
    },
    {
        zoneId,
        nodeId: 'forgeB1Material',
        flags: [{flag: 'forgeLava2', logic: andLogic(hasBossWeapon, orLogic(canCross4Gaps, hasIce, hasInvisibility))}],
        paths: [{nodeId: 'forgeBehindKey', doorId: 'forgeLava3', logic: drainedLava2}],
        entranceIds: ['forgeMaterialStairs2'],
        exits: [
            {objectId: 'forgeMaterialStairs2', logic: orLogic(canCross4Gaps, hasIce, hasInvisibility)},
        ],
    },
    // This is a pseudo node used to set the forgeLava3 key behind using a small key on the keyblock.
    {
        zoneId,
        nodeId: 'forgeBehindKey',
        flags: [{flag: 'forgeLava3'}],
    },
    {
        zoneId,
        nodeId: 'forgeB2Material',
        flags: [{flag: 'forgeLava4', logic: orLogic(canCross4Gaps, hasIce, hasInvisibility)}],
        entranceIds: ['forgeMaterialStairs2'],
        exits: [{objectId: 'forgeMaterialStairs2'}],
    },
    {
        zoneId,
        nodeId: 'forgeB2',
        paths: [{nodeId: 'forgeStairPuzzle', logic: orLogic(drainedLava4, canCross4Gaps, hasIce, hasInvisibility)}],
        entranceIds: ['forgeStairs2'],
        exits: [
            {objectId: 'forgeStairs2'},
        ],
    },
    {
        zoneId,
        nodeId: 'forgeStairPuzzle',
        checks: [{objectId: 'forgeSmallKey'}],
        paths: [{nodeId: 'forgeB2', logic: orLogic(drainedLava4, canCross4Gaps, hasIce, hasInvisibility)}],
        entranceIds: ['forgeStairs2', 'forgeStairs3'],
        exits: [
            {objectId: 'forgeStairs2'},
            {objectId: 'forgeStairs3', logic: hasMitts}
        ],
    },
    {
        zoneId,
        nodeId: 'forgeBoss',
        checks: [{objectId: 'forgeBoss', logic: canDefeatBalloonMegapede}],
        paths: [{nodeId: 'forgeForge', logic: canDefeatBalloonMegapede}],
        entranceIds: ['forgeBossEntrance'],
        exits: [
            {objectId: 'forgeBossEntrance'}
        ],
    },
    {
        zoneId,
        nodeId: 'forgeForge',
        checks: [{objectId: 'forgeArmor'}],
        paths: [{nodeId: 'forgeBoss'}],
        entranceIds: ['forgeShortcut'],
        exits: [
            {objectId: 'forgeShortcut'},
        ],
    },
];
