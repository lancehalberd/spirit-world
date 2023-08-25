import {
    orLogic,
    canRemoveLightStones, canBeatIdols,
    hasSpiritSight, hasTrueSight, hasWeapon,
    logicHash
} from 'app/content/logic';



const zoneId = 'warTemple';
export const warTempleNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'warTempleChestEntrance',
        checks: [
            {objectId: 'warTemple:0:0x2-empty-0'},
            {objectId: 'warTemple:0:0x2-gloves-0'},
            {objectId: 'warTemple:0:0x2-empty-1'},
        ],
        entranceIds: ['warTempleChestEntrance'],
        exits: [{objectId: 'warTempleChestEntrance'}],
    },
    {
        zoneId,
        nodeId: 'warTempleNorthEntrance',
        checks: [
            {objectId: 'warTemple:0:0x0-empty-0'},
            {objectId: 'warTemple:0:0x0-empty-1'},
            {objectId: 'warTemple:0:0x0-empty-2'},
        ],
        entranceIds: ['warTempleNorthEntrance'],
        exits: [{objectId: 'warTempleNorthEntrance'}],
    },
    {
        zoneId,
        nodeId: 'warTempleNorthEastEntrance',
        checks: [{objectId: 'warTemple:0:2x0-empty-0'}],
        paths: [
            {nodeId: 'warTempleEastEntrance', logic: hasWeapon},
        ],
        entranceIds: [
            'warTempleNorthEastEntrance',
        ],
        exits: [
            {objectId: 'warTempleNorthEastEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleEastEntrance',
        paths: [
            {nodeId: 'warTempleNorthEastEntrance'},
            {nodeId: 'warTempleKeyDoor'},
        ],
        entranceIds: [
            'warTempleEastEntrance',
        ],
        exits: [
            {objectId: 'warTempleEastEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleKeyDoor',
        checks: [{objectId: 'warTemple:0:2x2-bigKey-0'}],
        flags: [{flag: 'warTempleKeyDoor'}],
        entranceIds: ['warTempleKeyDoor'],
        exits: [{objectId: 'warTempleKeyDoor'}],
    },
    {
        zoneId,
        nodeId: 'warTemplePitEntrance',
        checks: [{objectId: 'warTemple:0:2x2-peachOfImmortalityPiece-0'}],
        paths: [
            {nodeId: 'warTempleKeyDoor'},
        ],
        entranceIds: ['warTemplePitEntrance'],
    },
    {
        zoneId,
        nodeId: 'warTempleMainEntrance',
        paths: [
            {nodeId: 'warTempleKeyDoor'},
            {nodeId: 'warTemple:0:1x0-smallKey-0', logic: canRemoveLightStones},
        ],
        entranceIds: ['warTempleMainEntrance', 'warTempleLock1'],
        exits: [
            {objectId: 'warTempleMainEntrance'},
            {objectId: 'warTempleLock1'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTemple:0:1x0-smallKey-0',
        checks: [
            {objectId: 'warTemple:0:1x0-smallKey-0'},
            // The player can defeat all these enemies using stones now that enemies stay
            // defeated when leaving and returning to rooms.
            {objectId: 'warTemple:0:0x0-money-0', logic: orLogic(hasWeapon, canRemoveLightStones)},
            {objectId: 'warTempleMap', logic: orLogic(hasWeapon, canRemoveLightStones)},
        ],
        paths: [
            {nodeId: 'warTempleMainEntrance', logic: canRemoveLightStones},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleLock1',
        checks: [{objectId: 'warTempleHugeMoney', logic: orLogic(hasSpiritSight, hasTrueSight)}],
        paths: [
            {nodeId: 'warTempleStairs2', logic: orLogic(hasSpiritSight, hasTrueSight)},
        ],
        entranceIds: ['warTempleLock1'],
        exits: [
            {objectId: 'warTempleLock1'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleMoneyMarker',
        checks: [
            {objectId: 'warTempleSilver'}
        ],
        paths: [
            {nodeId: 'warTempleLock1'},
        ],
        entranceIds: ['warTempleMoneyMarker'],
    },
    {
        zoneId,
        nodeId: 'warTempleStairs2',
        paths: [
            {nodeId: 'warTempleLock1'},
        ],
        entranceIds: ['warTempleStairs2'],
        exits: [
            {objectId: 'warTempleStairs2'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTemple:2:0x0-pitEntrance-0',
        paths: [
            {nodeId: 'warTemple:2:0x0-pitEntrance-1', doorId: 'warTempleLock2'},
        ],
        entranceIds: ['warTempleStairs2'],
        exits: [
            {objectId: 'warTempleStairs2'},
            {objectId: 'warTemple:2:0x0-pitEntrance-0'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleKeyMarker',
        paths: [{nodeId: 'warTempleStairs2', logic: hasWeapon}],
        checks: [{objectId: 'warTemple:1:1x0-smallKey-0', logic: hasWeapon}],
        entranceIds: ['warTempleKeyMarker'],
    },
    {
        zoneId,
        nodeId: 'warTemple:2:0x0-pitEntrance-1',
        paths: [
            {nodeId: 'warTemple:2:0x0-pitEntrance-0', doorId: 'warTempleLock2'},
            {nodeId: 'warTempleBoss', doorId: 'warTempleBossDoor'},
        ],
        exits: [
            {objectId: 'warTemple:2:0x0-pitEntrance-1'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleBoss',
        checks: [
            {objectId: 'warTempleBoss', logic: canBeatIdols},
            {objectId: 'warTemple:2:0x0-astralProjection-0', logic: canBeatIdols},
        ],
    },
    // Spirit world is only accessible from outside
    {
        zoneId,
        nodeId: 'warTempleThroneRoom',
        paths: [
            {nodeId: 'warTempleLabPath', logic: logicHash.beastsDefeated},
        ],
        entranceIds: ['warTempleEntranceSpirit'],
        exits: [
            {objectId: 'warTempleEntranceSpirit'},
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleLabPath',
        paths: [
            {nodeId: 'warTempleThroneRoom', logic: logicHash.beastsDefeated},
        ],
        entranceIds: ['labEntrance'],
        exits: [
            {objectId: 'labEntrance', logic: logicHash.beastsDefeated},
        ],
    }
];
