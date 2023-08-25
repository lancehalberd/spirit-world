import {
    canTravelFarUnderWater, hasBossWeapon, hasCatEyes,
    hasClone, hasIronBoots, canRemoveLightStones, hasWeapon,
} from 'app/content/logic';


const zoneId = 'peachCave';
export const peachCaveNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'peachCave:markerA',
        paths: [
            { nodeId: 'peachCavePiece', logic: hasIronBoots },
            { nodeId: 'peachCaveBottom'},
        ],
        entranceIds: ['peachCave:markerA'],
    },
    {
        zoneId,
        nodeId: 'peachCaveBottom',
        checks: [{ objectId: 'peachCave:0:0x0-weapon-0' }],
        paths: [
            { nodeId: 'peachCaveWaterEntrance', logic: hasIronBoots },
            { nodeId: 'peachCave:markerB', logic: hasClone },
            { nodeId: 'peachCave:stairsUp', logic: hasWeapon },
        ],
        entranceIds: ['peachCave:markerA'],
    },
    {
        zoneId,
        nodeId: 'peachCave:stairsUp',
        checks: [{ objectId: 'peachCave:0:0x0-money-0' }],
        paths: [
            { nodeId: 'peachCaveBottom' },
        ],
        entranceIds: ['peachCave:stairsUp'],
        exits: [{ objectId: 'peachCave:stairsUp' }],
    },
    {
        zoneId,
        nodeId: 'peachCave:stairsDown',
        paths: [
            { nodeId: 'peachCaveBoss', logic: hasWeapon },
        ],
        entranceIds: ['peachCave:stairsDown'],
        exits: [{ objectId: 'peachCave:stairsDown' }],
    },
    {
        zoneId,
        nodeId: 'peachCaveBoss',
        checks: [{ objectId: 'peachCave:fullPeach', logic: hasBossWeapon }],
        paths: [
            // There is no path to `peachCave:stairsDown` from here because:
            // You can only return to `peachCave:stairsDown` from here if you've grown
            // the vine to the boss, which means you have access to `peachCave:stairsDown` already
            { nodeId: 'peachCave:pitB', logic: hasBossWeapon },
        ],
    },
    {
        zoneId,
        nodeId: 'peachCave:pitB',
        paths: [
            // Need mitts to lift rocks at the top of the stairs.
            { nodeId: 'peachCave:upperSilver', logic: canRemoveLightStones },
            { nodeId: 'peachCaveBoss' },
        ],
        exits: [{ objectId: 'peachCave:pitB' }],
    },
    {
        zoneId,
        nodeId: 'peachCave:markerB',
        paths: [
            { nodeId: 'peachCave:markerA', logic: hasClone },
            { nodeId: 'peachCaveWaterEntrance', logic: hasIronBoots },
        ],
        entranceIds: ['peachCave:waterEntrance', 'peachCave:markerB'],
        exits: [{ objectId: 'peachCave:waterEntrance' }],
    },
    {
        zoneId,
        nodeId: 'peachCaveTopEntrance',
        paths: [
            { nodeId: 'peachCave:pitA', logic: hasCatEyes },
        ],
        entranceIds: ['peachCaveTopEntrance'],
        exits: [{ objectId: 'peachCaveTopEntrance' }],
    },
    {
        zoneId,
        nodeId: 'peachCave:pitA',
        paths: [
            { nodeId: 'peachCaveTopEntrance', logic: hasCatEyes },
            { nodeId: 'peachCave:upperSilver', logic: hasClone },
            // Falling into the pit and holding south allows you to reach the peach piece without iron boots.
            { nodeId: 'peachCavePiece' },
        ],
        exits: [{ objectId: 'peachCave:pitA' }],
    },
    {
        zoneId,
        nodeId: 'peachCave:upperSilver',
        checks: [{ objectId: 'peachCaveSilver' }],
        paths: [
            // Blow up the crack to the west to reach pitA
            { nodeId: 'peachCave:pitA', logic: hasClone },
            // Just jump down to reach pitB
            { nodeId: 'peachCave:pitB' },
        ],
        exits: [{ objectId: 'peachCave:pitA' }],
    },
    {
        zoneId,
        nodeId: 'peachCavePiece',
        checks: [{ objectId: 'peachCavePiece' }],
        paths: [
            // There is a vortext that allows you to fall under water here.
            { nodeId: 'peachCave:markerA' },
            { nodeId: 'peachCave:markerB' },
        ],
    },
    {
        zoneId: 'peachCaveWater',
        nodeId: 'peachCaveWaterEntrance',
        paths: [
            { nodeId: 'peachCave:markerA' },
            { nodeId: 'peachCave:markerB' },
            { nodeId: 'peachCavePiece', logic: hasIronBoots },
        ],
        entranceIds: ['peachCaveUnderwaterEntrance'],
        exits: [
            { objectId: 'peachCaveUnderwaterEntrance', logic: canTravelFarUnderWater  },
        ],
    },
];
