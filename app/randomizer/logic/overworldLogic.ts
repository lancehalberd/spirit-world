import {
    canTravelFarUnderWater,
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
        ],
        entranceIds: [
            'elderEntrance', 'tombTeleporter',
            'lakeTunnelEntrance', 'peachCaveTopEntrance', 'peachCaveWaterEntrance', 'staffTowerEntrance',
            'tombEntrance', 'waterfallCaveEntrance',
        ],
        exits: [
            { objectId: 'elderEntrance' },
            { objectId: 'lakeTunnelEntrance' },
            { objectId: 'peachCaveTopEntrance' },
            { objectId: 'peachCaveWaterEntrance' },
            { objectId: 'staffTowerEntrance' },
            { objectId: 'tombEntrance', logic: hasMediumRange },
            { objectId: 'waterfallCaveEntrance' },
            { objectId: 'mainSpiritWorld', logic: hasTeleportation },
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
            { nodeId: 'overworldLakePiece' },
            // For door randomizer I would need to add the small fertility area in between here.
            // I will need to add it eventually when I add checks to the fertility temple.
            { nodeId: 'forestTempleSEArea' },
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
            {nodeId: 'overworldMain', logic: {requiredFlags: ['iceBeast']}},
        ],
        entranceIds: [
            'peachCaveWaterEntrance', 'riverTempleWaterEntrance',
        ],
        exits: [
            { objectId: 'peachCaveWaterEntrance', logic: canTravelFarUnderWater  },
            { objectId: 'riverTempleWaterEntrance', logic: canTravelFarUnderWater  },
        ],
    },
];
