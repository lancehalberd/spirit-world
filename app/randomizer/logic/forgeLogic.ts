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
        checks: [{objectId: 'forgePeachPiece', logic: hasMitts}],
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
        entranceIds: ['forgeStairs3'],
        exits: [
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
        complexNpcs: [
            {
                dialogueKey: 'forgeSmith',
                optionKey: 'forgeSmithReward',
                // Must fully upgrade the magic chakram and have iron boots to obtain this reward.
                // Upgrading costs 5 silver and 2 gold, but you could spend an additional 7 upgrading the normal chakram and leather boots.
                // As well as another 2 gold upgrading cloud boots and iron boots.
                logic: { requiredFlags: ['$weapon:2', '$ironBoots', '$totalSilverOre:12', '$totalGoldOre:4']},
            },
        ],
        flags: [{flag: 'canReachForgeSmith'}],
        paths: [{nodeId: 'forgeBoss'}],
        entranceIds: ['forgeShortcut'],
        exits: [
            {objectId: 'forgeShortcut'},
        ],
    },
];
