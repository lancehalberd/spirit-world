import {
    hasIronBoots, hasGloves, hasMitts, hasTeleportation,
    hasMediumRange, hasSpiritSight, orLogic,
} from 'app/content/logic';

import { LogicNode } from 'app/types';


const zoneId = 'overworld';
export const overworldNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'overworldMain',
        paths: [
            { nodeId: 'overworldMountain', logic: hasTeleportation },
            { nodeId: 'warTempleArea' },
        ],
        entranceIds: [
            'elderEntrance',
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
        paths: [
            { nodeId: 'overworldMain' },
            { nodeId: 'overworldWaterfall', logic: orLogic(hasTeleportation, hasIronBoots, hasMitts) },
        ],
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
];
