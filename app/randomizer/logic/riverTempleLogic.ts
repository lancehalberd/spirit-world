import {
    andLogic, orLogic, hasReleasedBeasts, canTravelFarUnderWater,
    hasBossWeapon, hasIronBoots,  hasMediumRange,
    hasFire, hasLightning, hasRoll, hasStaff,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

// The frostBeast flag is set correctly during simulation, so this logic works as expected.
const canMeltIce = orLogic({requiredFlags: ['frostBeast']}, andLogic(orLogic(hasLightning, hasFire), hasMediumRange));

// This logic does not appropriately support traversing the tower in reverse.
let zoneId = 'riverTempleWater';
export const riverTempleWaterNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'riverTempleWaterEntrance',
        checks: [
            {objectId: 'riverTempleSmallKey', logic: canTravelFarUnderWater},
            {objectId:'riverTemplePeachPiece', logic: canTravelFarUnderWater},
        ],
        entranceIds: ['riverTempleWaterEntrance',  'riverTempleWaterStairs'],
        exits: [
            {objectId: 'riverTempleWaterEntrance', logic: canTravelFarUnderWater},
            {objectId: 'riverTempleWaterStairs', logic: canTravelFarUnderWater}
        ],
    },
    {
        zoneId,
        nodeId: 'riverTempleSmallWaterArea',
        entranceIds: ['riverTempleWaterStairs'],
        paths: [{nodeId: 'riverTempleMainHall'}],
        exits: [
            {objectId: 'riverTempleWaterStairs', logic: canTravelFarUnderWater},
        ],
    },
    {
        zoneId,
        nodeId: 'riverTempleWaterMaze1',
        paths: [
            {nodeId: 'riverTempleMainHall', logic: canTravelFarUnderWater},
            {nodeId: 'riverTempleSEArea', logic: canTravelFarUnderWater},
        ],
    },
    {
        zoneId,
        nodeId: 'riverTempleWaterMaze2',
        checks: [{objectId: 'riverTempleSilver', logic:
            andLogic(canTravelFarUnderWater,
                // Defeating the frost beast removes the ice spikes.
                // The staff or roll can be used to pass under the ice spikes.
                orLogic({requiredFlags: ['frostBeast']}, hasRoll, hasStaff))
        }],
        paths: [
            {nodeId: 'riverTempleSEArea', logic: canTravelFarUnderWater},
            {nodeId: 'riverTempleSWArea', logic: canTravelFarUnderWater},
        ],
    },
];


zoneId = 'riverTemple';
export const riverTempleNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'riverTempleMainHall',
        paths: [
            {nodeId: 'riverTempleBoss', doorId: 'riverTempleBossDoor'},
            {nodeId: 'riverTempleAcrossFromChest',logic: canMeltIce},
            {nodeId: 'riverTempleSmallWaterArea', logic: hasIronBoots},
            {nodeId: 'riverTempleSEArea', logic: canMeltIce},
            {nodeId: 'riverTempleSWArea', doorId: 'riverTempleBigKeyDoor'},
            {nodeId: 'riverTempleWaterMaze1', logic: hasIronBoots},
        ],
    },
    {
        zoneId,
        nodeId: 'riverTempleAcrossFromChest',
        paths: [
            {nodeId: 'riverTempleMainHall',logic: canMeltIce},
            {nodeId: 'riverTempleUpperEntrance',logic: canMeltIce},
        ],
    },
    {
        zoneId,
        nodeId: 'riverTempleUpperEntrance',
        checks: [
            {objectId: 'riverTempleBigChest'},
            {objectId: 'riverTempleMoney'},
        ],
        paths: [
            {nodeId: 'riverTempleAcrossFromChest', logic: canMeltIce},
        ],
        entranceIds: ['riverTempleUpperEntrance'],
    },
    {
        zoneId,
        nodeId: 'riverTempleSEArea',
        paths: [
            {nodeId: 'riverTempleMainHall', logic: canMeltIce},
            {nodeId: 'riverTempleWaterMaze1',logic: hasIronBoots},
            {nodeId: 'riverTempleWaterMaze2', logic: hasIronBoots},
            {nodeId: 'riverTempleSWArea', logic: canMeltIce},
        ],
    },
    {
        zoneId,
        nodeId: 'riverTempleSWArea',
        checks: [{objectId: 'riverTempleBigKey'}],
        paths: [
            {nodeId: 'riverTempleMainHall', doorId: 'riverTempleBigKeyDoor'},
            {nodeId: 'riverTempleWaterMaze2', logic: hasIronBoots},
            {nodeId: 'riverTempleSEArea', logic: canMeltIce},
        ],
    },
    {
        zoneId,
        nodeId: 'riverTempleBoss',
        checks: [{objectId: 'frostBeast', logic: andLogic(hasReleasedBeasts, orLogic(hasIronBoots, canMeltIce), hasBossWeapon) }],
    },
];
