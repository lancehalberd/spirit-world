import {
    canReleaseBeasts, canTravelFarUnderWater,
    hasCloudBoots, hasIronBoots, hasGloves, hasMitts, hasTeleportation,
    hasMediumRange, hasSpiritSight, orLogic,
} from 'app/content/logic';

import { LogicNode } from 'app/types';


let zoneId = 'overworld';
export const overworldNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'overworldMain',
        paths: [
            { nodeId: 'overworldMountain', logic: hasGloves },
            { nodeId: 'warTempleArea' },
            { nodeId: 'mainSpiritWorld', logic: hasTeleportation },
        ],
        entranceIds: [
            'elderEntrance', 'tombTeleporter',
            'lakeTunnelEntrance', 'peachCaveTopEntrance', 'peachCaveWaterEntrance', 'staffTowerEntrance',
            'tombEntrance', 'waterfallCaveEntrance',
        ],
        exits: [
            { objectId: 'elderEntrance' },
            { objectId: 'lakeTunnelEntrance', logic: hasGloves },
            { objectId: 'peachCaveTopEntrance' },
            { objectId: 'peachCaveWaterEntrance' },
            { objectId: 'staffTowerEntrance' },
            { objectId: 'tombEntrance', logic: hasMediumRange },
            { objectId: 'waterfallCaveEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleArea',
        paths: [
            { nodeId: 'overworldMain' },
        ],
        entranceIds: [
            'warTempleChestEntrance',
            'warTempleEastEntrance',
            'warTempleEntrance',
            'warTempleNortheastEntrance',
            'warTempleNorthEntrance',
            'warTemplePeachEntrance',
            'warTempleKeyDoor',
        ],
        exits: [
            { objectId: 'warTempleChestEntrance' },
            { objectId: 'warTempleEastEntrance', logic: hasGloves },
            { objectId: 'warTempleEntrance', logic: hasSpiritSight },
            { objectId: 'warTempleNortheastEntrance' },
            { objectId: 'warTempleNorthEntrance' },
            { objectId: 'warTemplePeachEntrance', logic: hasGloves },
            // This is a one way door that stays open once you leave it, so we don't need to include this direction
            //{ objectId: 'warTempleKeyDoor', logic: hasSpiritSight },
        ],
    },
    {
        zoneId,
        nodeId: 'overworldMountain',
        checks: [
            { objectId: 'overworldCliffPeachPiece' },
        ],
        paths: [
            { nodeId: 'overworldMain' },
            { nodeId: 'overworldWaterfall', logic: orLogic(hasTeleportation, hasIronBoots, hasMitts) },
        ],
        entranceIds: ['caves-ascentEntrance'],
        exits: [{objectId: 'caves-ascentEntrance' }],
    },
    {
        zoneId,
        nodeId: 'overworldWaterfall',
        paths: [
            { nodeId: 'overworldMountain', logic: orLogic(hasTeleportation, hasIronBoots, hasMitts) },
        ],
        entranceIds: ['waterfallTowerEntrance'],
        exits: [{ objectId: 'waterfallTowerEntrance' }],
    },
    {
        zoneId,
        nodeId: 'overworldLakePiece',
        checks: [
            { objectId: 'overworldLakePiece' },
        ],
    },
    {
        zoneId,
        nodeId: 'mainSpiritWorld',
        paths: [
            { nodeId: 'spiritWorldMountain', logic: hasGloves },
            { nodeId: 'overworldLakePiece' },
            // For door randomizer I would need to add the small fertility area in between here.
            // I will need to add it eventually when I add checks to the fertility temple.
            { nodeId: 'forestTempleSEArea' },
        ],
    },
    {
        zoneId,
        nodeId: 'spiritWorldMountain',
        paths: [
            { nodeId: 'mainSpiritWorld' },
        ],
    },
    {
        zoneId,
        nodeId: 'forestTempleSEArea',
        paths: [
            { nodeId: 'mainSpiritWorld' },
            { nodeId: 'forestTempleSWArea', logic: hasCloudBoots },
            { nodeId: 'forestTempleNEArea', logic: hasCloudBoots },
            { nodeId: 'forestTempleNWArea', logic: hasCloudBoots },
        ],
        entranceIds: ['forestTempleLadder1'],
        exits: [{ objectId: 'forestTempleLadder1' }],
    },
    {
        zoneId,
        nodeId: 'forestTempleNEArea',
        entranceIds: ['forestTempleLadder2', 'forestTempleLadder3'],
        exits: [{ objectId: 'forestTempleLadder2' }, { objectId: 'forestTempleLadder3' }],
    },
    {
        zoneId,
        nodeId: 'forestTempleNWArea',
        entranceIds: ['forestTempleLadder4', 'forestTempleLadder5'],
        exits: [{ objectId: 'forestTempleLadder4' }, { objectId: 'forestTempleLadder5' }],
    },
    {
        zoneId,
        nodeId: 'forestTempleSWArea',
        entranceIds: ['elderSpiritEntrance'],
        exits: [{ objectId: 'elderSpiritEntrance' }],
    },
];

zoneId = 'underwater';
export const underwaterNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'underLake',
        paths: [
            // This logic doesn't work since the randomizer doesn't currently set flags when simulating.
            {nodeId: 'overworldMain', logic: {requiredFlags: ['frostBeast']}},
        ],
        entranceIds: [
            'peachCaveUnderwaterEntrance', 'riverTempleWaterEntrance',
        ],
        exits: [
            { objectId: 'peachCaveUnderwaterEntrance', logic: canTravelFarUnderWater  },
            { objectId: 'riverTempleWaterEntrance', logic: canTravelFarUnderWater  },
        ],
    },
];

zoneId = 'sky';
export const skyNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'outsideCrater',
        paths: [
            { nodeId: 'overworldMountain' },
            { nodeId: 'outsideHelix', logic: hasCloudBoots },
        ],
        entranceIds: ['caves-ascentExit', 'craterEntrance'],
        exits: [
            { objectId: 'craterEntrance', logic: canReleaseBeasts },
        ],
    },
    {
        zoneId,
        nodeId: 'outsideHelix',
        paths: [
            { nodeId: 'outsideCrater', logic: hasCloudBoots },
        ],
        entranceIds: ['helixSkyEntrance'],
        exits: [
            { objectId: 'helixSkyEntrance' },
        ],
    },
    {
        zoneId,
        // Note that this is in the spirit world.
        nodeId: 'waterfallTowerSky',
        paths: [{ nodeId: 'spiritWorldMountain' }],
        entranceIds: ['waterfallTowerTopEntrance'],
        exits: [{ objectId: 'waterfallTowerTopEntrance' }],
    }
    // Over river temple is not implemented yet
    // outside waterfall tower is not interesting in the material world currently.
    // No tower connections in sky yet
];
