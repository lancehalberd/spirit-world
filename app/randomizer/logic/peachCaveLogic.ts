import { hasClone, hasIronBoots, hasWeaponCheck } from 'app/content/logic';

import { LogicNode } from 'app/types';

const zoneId = 'newPeachCave';
export const peachCaveNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'newPeachCave:markerA',
        checks: [{ objectId: 'newPeachCave:0:0x0-weapon-0' }],
        paths: [
            { nodeId: 'peachCaveWaterEntrance', logic: hasIronBoots },
            { nodeId: 'newPeachCave:markerB', logic: hasClone },
            { nodeId: 'newPeachCave:stairsUp', logic: hasWeaponCheck },
        ],
        entranceIds: ['newPeachCave:markerA'],
    },
    {
        zoneId,
        nodeId: 'newPeachCave:stairsUp',
        checks: [{ objectId: 'newPeachCave:0:0x0-money-0' }],
        paths: [
            { nodeId: 'newPeachCave:markerA' },
        ],
        entranceIds: ['newPeachCave:stairsUp'],
        exits: [{ objectId: 'newPeachCave:stairsUp' }],
    },
    {
        zoneId,
        nodeId: 'newPeachCave:stairsDown',
        paths: [
            { nodeId: 'newPeachCave:boss', logic: hasWeaponCheck },
        ],
        entranceIds: ['newPeachCave:stairsDown'],
        exits: [{ objectId: 'newPeachCave:stairsDown' }],
    },
    {
        zoneId,
        nodeId: 'newPeachCave:boss',
        checks: [{ objectId: 'newPeachCave:boss', logic: hasWeaponCheck }],
        paths: [
            // There is no path to `newPeachCave:stairsDown` from here because:
            // You can only return to `newPeachCave:stairsDown` from here if you've grown 
            // the vine to the boss, which means you have access to `newPeachCave:stairsDown` already
            { nodeId: 'newPeachCave:pitB', logic: hasWeaponCheck },
        ],
    },
    {
        zoneId,
        nodeId: 'newPeachCave:pitB',
        paths: [
            { nodeId: 'newPeachCave:pitA', logic: hasClone },
            { nodeId: 'newPeachCave:boss', },
        ],
        exits: [{ objectId: 'newPeachCave:pitB' }],
    },
    {
        zoneId,
        nodeId: 'newPeachCave:markerB',
        paths: [
            { nodeId: 'newPeachCave:markerA', logic: hasClone },
            { nodeId: 'peachCaveWaterEntrance', logic: hasIronBoots },
        ],
        entranceIds: ['newPeachCave:waterEntrance', 'newPeachCave:markerB'],
        exits: [{ objectId: 'newPeachCave:waterEntrance' }],
    },
    {
        zoneId,
        nodeId: 'peachCaveTopEntrance',
        paths: [
            { nodeId: 'newPeachCave:pitA' },
        ],
        entranceIds: ['peachCaveTopEntrance'],
        exits: [{ objectId: 'peachCaveTopEntrance' }],
    },
    {
        zoneId,
        nodeId: 'newPeachCave:pitA',
        paths: [
            { nodeId: 'peachCaveTopEntrance' },
            { nodeId: 'newPeachCave:pitB', logic: hasClone },
        ],
        exits: [{ objectId: 'newPeachCave:pitA' }],
    },
    {
        zoneId,
        nodeId: 'peachCavePiece',
        checks: [{ objectId: 'peachCavePiece' }],
        paths: [
            { nodeId: 'peachCaveWater:markerA', logic: hasIronBoots },
            { nodeId: 'newPeachCave:markerB' },
        ],
    },
    {
        zoneId: 'peachCaveWater',
        nodeId: 'peachCaveWaterEntrance',
        paths: [
            { nodeId: 'newPeachCave:markerA' },
            { nodeId: 'newPeachCave:markerB' },
            { nodeId: 'peachCavePiece' },
        ],
    },
];
