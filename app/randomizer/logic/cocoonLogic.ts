import {
    andLogic,
    canCross2Gaps,
    canUseTeleporters,
    orLogic,
    hasAstralProjection,
    hasBossWeapon,
    hasGloves,
    hasRangedPush,
    hasSpiritBarrier,
    hasSpiritSight,
    canRemoveLightStones,
    hasSomersault,
    hasTeleportation,
} from 'app/content/logic';


const zoneId = 'cocoon';
export const cocoonNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'cocoonEntrance',
        paths: [
            {nodeId: 'cocoon1FNW', logic: andLogic(canUseTeleporters, hasBossWeapon, canCross2Gaps)},
            {nodeId: 'cocoon1FNE', logic: andLogic(canUseTeleporters, hasBossWeapon, canCross2Gaps)},
            // Falling into any pits will take you to the main B1 area in the material world.
            {nodeId: 'cocoonB1'},
        ],
        entranceIds: ['cocoonEntrance'],
        exits: [{objectId: 'cocoonEntrance'}],
    },
    {
        zoneId,
        nodeId: 'cocoon1FNW',
        paths: [
            // Fall into the pit.
            {nodeId: 'cocoonB1NW'},
        ],
        entranceIds: ['cocoonLadderNW'],
        exits: [{objectId: 'cocoonLadderNW', logic: andLogic(hasBossWeapon, canRemoveLightStones)}],
    },
    {
        zoneId,
        nodeId: 'cocoon1FNE',
        paths: [
            // Fall into the pit.
            {nodeId: 'cocoonB1NE'},
        ],
        entranceIds: ['cocoonLadderNE', 'cocoonBigLock'],
        exits: [
            {objectId: 'cocoonLadderNE', logic: andLogic(hasBossWeapon, canRemoveLightStones)},
            {objectId: 'cocoonBigLock'},
        ],
    },
    {
        zoneId,
        nodeId: 'cocoon1FSW',
        checks: [{objectId: 'cocoonSmallKey', logic: canCross2Gaps}],
        paths: [
            {nodeId: 'cocoonEntrance', logic: andLogic(canUseTeleporters, canCross2Gaps)},
            // Fall into the pit.
            {nodeId: 'cocoonB1SW'},
        ],
        exits: [{objectId: 'cocoonOpenDoor'}],
        entranceIds: ['cocoonOpenDoor'],
    },
    {
        zoneId,
        nodeId: 'cocoon1FSE',
        checks: [{objectId: 'cocoonBigKey', logic: andLogic(hasAstralProjection, canRemoveLightStones)}],
        paths: [
            {nodeId: 'cocoonEntrance', logic: canUseTeleporters},
            // Fall into the pit.
            {nodeId: 'cocoonB1SE'},
        ],
        entranceIds: ['cocoonSealedLockedDoor'],
    },
    {
        zoneId,
        nodeId: 'cocoonB1',
        paths: [
            {nodeId: 'cocoonB1SW', logic: canUseTeleporters},
            {nodeId: 'cocoonB1SE', logic: canUseTeleporters},
        ],
    },
    {
        zoneId,
        nodeId: 'cocoonB1NW',
        paths: [{nodeId: 'cocoonB1', logic: canUseTeleporters}],
        entranceIds: ['cocoonLadderNW'],
    },
    {
        zoneId,
        nodeId: 'cocoonB1NE',
        // This puzzle requires gloves specifically because destroying the stones with the staff
        // doesn't remove them in the material world.
        checks: [{objectId: 'cocoonBigMoney', logic: andLogic(hasAstralProjection, hasGloves)}],
        paths: [{nodeId: 'cocoonB1', logic: canUseTeleporters}],
        entranceIds: ['cocoonLadderNE'],
    },
    {
        zoneId,
        nodeId: 'cocoonBigChest',
        checks: [{objectId: 'cocoonBigChest'}],
        entranceIds: ['cocoonLadderBack', 'cocoonBigLock'],
        exits: [{objectId: 'cocoonLadderBack'}, {objectId: 'cocoonBigLock'}],
    },
    {
        zoneId,
        nodeId: 'cocoonB1SW',
        paths: [{nodeId: 'cocoonB1', logic: canUseTeleporters}],
        entranceIds: ['cocoonOpenDoor'],
        exits: [{objectId: 'cocoonOpenDoor'}]
    },
    {
        zoneId,
        nodeId: 'cocoonB1SE',
        checks: [{objectId: 'cocoonMap'}],
        paths: [{nodeId: 'cocoonB1', logic: canUseTeleporters}],
        entranceIds: ['cocoonLockedDoor'],
        exits: [{objectId: 'cocoonLockedDoor'}]
    },
    // This nod represent basically all of B2 + B3. Nothing is in logic in these nodes until you
    // use the teleporter blocked by the spirit cloak switch tutorial, but after that you only
    // need the Chakram/Bow to solve the rolling ball puzzles+defeat some enemies to reach the boss.
    {
        zoneId,
        nodeId: 'cocoonB2AndB3',
        checks: [{objectId: 'cocoonPotion', logic: andLogic(hasBossWeapon, hasSpiritBarrier)}],
        flags: [{flag: 'cocoonBossStarted'}],
        paths: [
            {nodeId: 'cocoonBoss', logic: andLogic(hasBossWeapon, hasRangedPush, canUseTeleporters, hasSpiritBarrier)},
        ],
        entranceIds: ['cocoonLadderBack'],
        exits: [{objectId: 'cocoonLadderBack'}],
    },
    {
        zoneId,
        nodeId: 'cocoonBoss',
        paths: [
            {nodeId: 'dreamMain'},
        ],
        entranceIds: ['cocoonDreamTeleporter'],
        exits: [{objectId: 'cocoonDreamTeleporter'}],
        checks: [
            {objectId: 'cocoonBoss', logic: hasSpiritSight},
            {objectId: 'cocoonSilver', logic: orLogic(hasTeleportation, hasSomersault) },
        ],
    },
];
